import { supabase } from '../lib/supabase';

export class UploadService {
  // Check if bucket exists, create if it doesn't
  static async ensureBucketExists(bucketName: string, isPublic: boolean = true): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        throw listError;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        // Create bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: isPublic,
          fileSizeLimit: 52428800, // 50MB
          allowedMimeTypes: isPublic ? ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'] : undefined
        });

        if (createError) {
          // If bucket creation fails, it might already exist or we don't have permissions
          console.warn(`Could not create bucket ${bucketName}:`, createError);
          // Don't throw - let the upload attempt happen, it might work if bucket exists
        }
      }
    } catch (error) {
      console.error(`Error ensuring bucket ${bucketName} exists:`, error);
      // Don't throw - let the upload attempt happen
    }
  }

  // Upload file to Supabase Storage
  static async uploadFile(
    file: File,
    bucket: string,
    path: string,
    options?: {
      cacheControl?: string;
      upsert?: boolean;
    }
  ): Promise<{ path: string; publicUrl: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert || false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        path: data.path,
        publicUrl,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  // Upload multiple files
  static async uploadMultipleFiles(
    files: File[],
    bucket: string,
    basePath: string,
    userId: string
  ): Promise<Array<{ path: string; publicUrl: string; name: string }>> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${Date.now()}-${index}.${fileExtension}`;
        const filePath = `${basePath}/${userId}/${fileName}`;

        const result = await this.uploadFile(file, bucket, filePath);
        return {
          ...result,
          name: file.name,
        };
      });

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  // Upload listing images
  static async uploadListingImages(
    files: File[],
    userId: string,
    listingId?: string
  ): Promise<Array<{ url: string; public_id: string; caption?: string; is_primary: boolean }>> {
    try {
      const basePath = listingId ? `listings/${listingId}` : 'listings/temp';
      const results = await this.uploadMultipleFiles(files, 'listing-images', basePath, userId);

      return results.map((result, index) => ({
        url: result.publicUrl,
        public_id: result.path,
        caption: '',
        is_primary: index === 0, // First image is primary
      }));
    } catch (error) {
      console.error('Error uploading listing images:', error);
      throw error;
    }
  }

  // Upload user avatar
  static async uploadUserAvatar(
    file: File,
    userId: string
  ): Promise<{ url: string; public_id: string }> {
    const fileExtension = file.name.split('.').pop();
    const fileName = `avatar-${Date.now()}.${fileExtension}`;
    // Use simpler path structure: {userId}/filename to match listing-images pattern
    const filePath = `${userId}/${fileName}`;

    // Try primary bucket first
    let bucketName = 'user-avatars';
    
    try {
      // Ensure bucket exists before uploading
      await this.ensureBucketExists(bucketName, true);
      
      const result = await this.uploadFile(file, bucketName, filePath, {
        upsert: true // Allow overwriting existing files
      });

      return {
        url: result.publicUrl,
        public_id: result.path,
      };
    } catch (primaryError: any) {
      // If primary bucket fails, try fallback to listing-images bucket
      if (primaryError?.message?.includes('Bucket not found') || 
          primaryError?.message?.includes('The resource was not found') ||
          primaryError?.message?.includes('not found')) {
        console.warn(`Primary bucket ${bucketName} not found, trying fallback...`);
        
        try {
          // Try using listing-images bucket as fallback
          bucketName = 'listing-images';
          const fallbackPath = `user-avatars/${userId}/${fileName}`;
          
          const result = await this.uploadFile(file, bucketName, fallbackPath, {
            upsert: true
          });

          return {
            url: result.publicUrl,
            public_id: result.path,
          };
        } catch (fallbackError) {
          console.error('Both primary and fallback bucket uploads failed:', {
            primary: primaryError,
            fallback: fallbackError
          });
          // Throw the original error with more context
          throw new Error(`Upload failed: ${primaryError?.message || primaryError}. Please ensure the 'user-avatars' storage bucket exists in your Supabase project.`);
        }
      } else {
        // Re-throw non-bucket-related errors
        throw primaryError;
      }
    }
  }

  // Upload documents
  static async uploadDocuments(
    files: File[],
    userId: string,
    listingId?: string
  ): Promise<Array<{ name: string; url: string; type: string; public_id: string }>> {
    try {
      const basePath = listingId ? `documents/${listingId}` : 'documents/temp';
      const results = await this.uploadMultipleFiles(files, 'documents', basePath, userId);

      return results.map((result) => ({
        name: result.name,
        url: result.publicUrl,
        type: this.getDocumentType(result.name),
        public_id: result.path,
      }));
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  // Delete file
  static async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Delete multiple files
  static async deleteMultipleFiles(bucket: string, paths: string[]): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting multiple files:', error);
      throw error;
    }
  }

  // Get file URL
  static getFileUrl(bucket: string, path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrl;
  }

  // Get signed URL for private files
  static async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }

  // Validate file type
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  // Validate file size
  static validateFileSize(file: File, maxSizeInMB: number): boolean {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
  }

  // Get document type from filename
  private static getDocumentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'ownership';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'registration';
      case 'doc':
      case 'docx':
        return 'insurance';
      default:
        return 'other';
    }
  }

  // Compress image before upload
  static async compressImage(
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}