import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, X, Image, FileText, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { UploadService } from '../services/upload';
import { toast } from 'sonner';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  onRemove: (index: number) => void;
  files: File[];
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  uploadType?: 'images' | 'documents' | 'mixed';
  disabled?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  onRemove,
  files,
  maxFiles = 10,
  maxSize = 5,
  acceptedTypes,
  uploadType = 'images',
  disabled = false,
  className = '',
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const getAcceptedTypes = () => {
    if (acceptedTypes) return acceptedTypes;
    
    switch (uploadType) {
      case 'images':
        return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      case 'documents':
        return ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      case 'mixed':
        return ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      default:
        return ['image/jpeg', 'image/png', 'image/webp'];
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name} is too large. Maximum size is ${maxSize}MB`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${file.name} is not a supported file type`);
          } else {
            toast.error(`${file.name}: ${error.message}`);
          }
        });
      });
    }

    // Handle accepted files
    if (acceptedFiles.length > 0) {
      const validFiles = acceptedFiles.filter(file => {
        if (!UploadService.validateFileType(file, getAcceptedTypes())) {
          toast.error(`${file.name} is not a supported file type`);
          return false;
        }
        if (!UploadService.validateFileSize(file, maxSize)) {
          toast.error(`${file.name} is too large. Maximum size is ${maxSize}MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        const newFiles = [...files, ...validFiles].slice(0, maxFiles);
        onUpload(newFiles);
      }
    }
  }, [files, maxFiles, maxSize, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedTypes().reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxSize * 1024 * 1024,
    maxFiles: maxFiles - files.length,
    disabled: disabled || files.length >= maxFiles,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  const compressAndUpload = async (file: File, index: number) => {
    try {
      setUploadProgress(prev => ({ ...prev, [index]: 0 }));
      
      let processedFile = file;
      
      // Compress images
      if (file.type.startsWith('image/')) {
        processedFile = await UploadService.compressImage(file, 1200, 0.8);
      }
      
      setUploadProgress(prev => ({ ...prev, [index]: 50 }));
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[index] || 0;
          if (current < 90) {
            return { ...prev, [index]: current + 10 };
          }
          return prev;
        });
      }, 100);
      
      // Simulate upload completion
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [index]: 100 }));
        
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[index];
            return newProgress;
          });
        }, 500);
      }, 1000);
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Failed to process ${file.name}`);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[#0B132B] bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 text-gray-400">
            <Upload className="w-full h-full" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Upload files'}
            </p>
            <p className="text-sm text-gray-600">
              Drag and drop files here, or click to select files
            </p>
          </div>
          
          <div className="text-xs text-gray-500">
            <p>Max {maxFiles} files, {maxSize}MB each</p>
            <p>Supported: {getAcceptedTypes().join(', ')}</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Selected Files ({files.length}/{maxFiles})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpload([])}
              disabled={disabled}
            >
              Clear All
            </Button>
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-gray-500">
                    {getFileIcon(file)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  
                  {uploadProgress[index] !== undefined && (
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#0B132B] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[index]}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {uploadProgress[index]}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {uploadProgress[index] === 100 && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(index)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Image Previews */}
      {uploadType === 'images' && files.some(f => f.type.startsWith('image/')) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Image Previews</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {files
              .filter(file => file.type.startsWith('image/'))
              .map((file, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => onRemove(files.indexOf(file))}
                      disabled={disabled}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {index === 0 && (
                    <Badge className="absolute top-2 left-2 text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Upload Status */}
      {uploading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-blue-700">Uploading files...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
