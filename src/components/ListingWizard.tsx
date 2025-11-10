import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Upload, MapPin, DollarSign, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import FileUpload from './FileUpload';
import { UploadService } from '../services/upload';
import { useAuth } from '../contexts/AuthContext';

interface ListingWizardProps {
  onComplete: (listingData: any) => void;
  onCancel: () => void;
}

interface ListingData {
  type: 'sale' | 'rent';
  category: string;
  subcategory: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  rentPeriod?: string;
  location: {
    address: string;
    city: string;
    subcity: string;
    woreda?: string;
    coordinates?: { lat: number; lng: number };
  };
  images: File[];
  documents: File[];
  features: Record<string, any>;
}

const steps = [
  { id: 1, title: 'Type & Category', icon: FileText, description: 'Choose listing type and category' },
  { id: 2, title: 'Basic Info', icon: FileText, description: 'Title and description' },
  { id: 3, title: 'Pricing', icon: DollarSign, description: 'Set price and terms' },
  { id: 4, title: 'Location', icon: MapPin, description: 'Property location' },
  { id: 5, title: 'Media', icon: ImageIcon, description: 'Photos and documents' },
  { id: 6, title: 'Review', icon: Check, description: 'Review and submit' }
];

const categories = {
  'house': {
    label: 'House',
    subcategories: ['Villa', 'Townhouse', 'Apartment', 'Condominium', 'Studio', 'Other']
  },
  'car': {
    label: 'Car',
    subcategories: ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Other']
  },
  'land': {
    label: 'Land',
    subcategories: ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Other']
  },
  'commercial': {
    label: 'Commercial',
    subcategories: ['Office', 'Retail', 'Warehouse', 'Restaurant', 'Hotel', 'Other']
  },
  'other': {
    label: 'Other',
    subcategories: ['Furniture', 'Electronics', 'Services', 'Other']
  }
};

const ListingWizard: React.FC<ListingWizardProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [listingData, setListingData] = useState<ListingData>({
    type: 'sale',
    category: '',
    subcategory: '',
    title: '',
    description: '',
    price: 0,
    currency: 'ETB',
    location: {
      address: '',
      city: '',
      subcity: '',
      woreda: ''
    },
    images: [],
    documents: [],
    features: {}
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!listingData.category) newErrors.category = 'Please select a category';
        if (!listingData.subcategory) newErrors.subcategory = 'Please select a subcategory';
        break;
      case 2:
        if (!listingData.title.trim()) newErrors.title = 'Title is required';
        if (listingData.title.length < 10) newErrors.title = 'Title must be at least 10 characters';
        if (listingData.title.length > 100) newErrors.title = 'Title must be less than 100 characters';
        if (!listingData.description.trim()) newErrors.description = 'Description is required';
        if (listingData.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
        break;
      case 3:
        if (!listingData.price || listingData.price <= 0) newErrors.price = 'Please enter a valid price';
        if (listingData.type === 'rent' && !listingData.rentPeriod) newErrors.rentPeriod = 'Please select a rental period';
        break;
      case 4:
        if (!listingData.location.address.trim()) newErrors.address = 'Address is required';
        if (!listingData.location.city.trim()) newErrors.city = 'City is required';
        if (!listingData.location.subcity.trim()) newErrors.subcity = 'Subcity is required';
        break;
      case 5:
        if (listingData.images.length === 0) newErrors.images = 'At least one image is required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleImageUpload = (files: File[]) => {
    setListingData(prev => ({ ...prev, images: files }));
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const handleDocumentUpload = (files: File[]) => {
    setListingData(prev => ({ ...prev, documents: files }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const image of listingData.images) {
        const result = await UploadService.uploadFile(
          image,
          'listing-images',
          `${user?.id}/${Date.now()}/${image.name}`
        );
        imageUrls.push(result.publicUrl);
      }

      // Upload documents
      const documentUrls: string[] = [];
      for (const doc of listingData.documents) {
        const result = await UploadService.uploadFile(
          doc,
          'listing-documents',
          `${user?.id}/${Date.now()}/${doc.name}`
        );
        documentUrls.push(result.publicUrl);
      }

      const { rentPeriod, images, documents, ...listingDataWithoutFiles } = listingData;
      
      const finalListingData = {
        ...listingDataWithoutFiles,
        rent_period: rentPeriod, // Convert camelCase to snake_case
        images: imageUrls.map((url, index) => ({
          url,
          public_id: `${user?.id}/${Date.now()}/${listingData.images[index]?.name || 'image'}`,
          caption: '',
          is_primary: index === 0
        })),
        documents: documentUrls.map((url, index) => ({
          name: listingData.documents[index]?.name || 'document',
          url,
          type: 'other',
          public_id: `${user?.id}/${Date.now()}/${listingData.documents[index]?.name || 'document'}`
        })),
        owner_id: user?.id,
        status: 'pending',
        verified: false,
        views: 0,
        is_active: true
      };

      onComplete(finalListingData);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Listing Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setListingData(prev => ({ ...prev, type: 'sale' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    listingData.type === 'sale'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">For Sale</div>
                  <div className="text-sm text-gray-600">Sell your property</div>
                </button>
                <button
                  onClick={() => setListingData(prev => ({ ...prev, type: 'rent' }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    listingData.type === 'rent'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">For Rent</div>
                  <div className="text-sm text-gray-600">Rent your property</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Category</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(categories).map(([key, category]) => (
                  <button
                    key={key}
                    onClick={() => setListingData(prev => ({ ...prev, category: key, subcategory: '' }))}
                    className={`p-3 border rounded-lg text-center transition-all ${
                      listingData.category === key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            {listingData.category && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Subcategory</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories[listingData.category as keyof typeof categories].subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setListingData(prev => ({ ...prev, subcategory: sub }))}
                      className={`p-3 border rounded-lg text-center transition-all ${
                        listingData.subcategory === sub
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                {errors.subcategory && <p className="text-red-500 text-sm mt-1">{errors.subcategory}</p>}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <Input
                value={listingData.title}
                onChange={(e) => setListingData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a compelling title for your listing"
                maxLength={100}
                className={errors.title ? 'border-red-500' : ''}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{errors.title || 'Make it descriptive and attractive'}</span>
                <span>{listingData.title.length}/100</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={listingData.description}
                onChange={(e) => setListingData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your property in detail. Include key features, amenities, and any important information..."
                rows={6}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{errors.description || 'Be detailed and honest about your property'}</span>
                <span>{listingData.description.length} characters</span>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price ({listingData.currency})</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="number"
                  value={listingData.price || ''}
                  onChange={(e) => setListingData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  className={`pl-10 ${errors.price ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            {listingData.type === 'rent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rental Period</label>
                <select
                  value={listingData.rentPeriod || ''}
                  onChange={(e) => setListingData(prev => ({ ...prev, rentPeriod: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.rentPeriod ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select rental period</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {errors.rentPeriod && <p className="text-red-500 text-sm mt-1">{errors.rentPeriod}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={listingData.currency}
                onChange={(e) => setListingData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <Input
                value={listingData.location.address}
                onChange={(e) => setListingData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, address: e.target.value }
                }))}
                placeholder="Enter the full address"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <Input
                  value={listingData.location.city}
                  onChange={(e) => setListingData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, city: e.target.value }
                  }))}
                  placeholder="e.g., Addis Ababa"
                  className={errors.city ? 'border-red-500' : ''}
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcity</label>
                <Input
                  value={listingData.location.subcity}
                  onChange={(e) => setListingData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, subcity: e.target.value }
                  }))}
                  placeholder="e.g., Bole"
                  className={errors.subcity ? 'border-red-500' : ''}
                />
                {errors.subcity && <p className="text-red-500 text-sm mt-1">{errors.subcity}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Woreda (Optional)</label>
              <Input
                value={listingData.location.woreda || ''}
                onChange={(e) => setListingData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, woreda: e.target.value }
                }))}
                placeholder="e.g., Bole 01"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Property Images</label>
              <FileUpload
                files={listingData.images}
                onUpload={handleImageUpload}
                onRemove={(index) => setListingData(prev => ({ 
                  ...prev, 
                  images: prev.images.filter((_, i) => i !== index)
                }))}
                maxFiles={10}
                maxSize={5}
                uploadType="images"
                className="border-2 border-dashed border-gray-300 rounded-lg p-6"
              />
              {errors.images && <p className="text-red-500 text-sm mt-1">{errors.images}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Legal Documents (Optional)</label>
              <FileUpload
                files={listingData.documents}
                onUpload={handleDocumentUpload}
                onRemove={(index) => setListingData(prev => ({ 
                  ...prev, 
                  documents: prev.documents.filter((_, i) => i !== index)
                }))}
                maxFiles={5}
                maxSize={5}
                uploadType="documents"
                className="border-2 border-dashed border-gray-300 rounded-lg p-6"
              />
              <p className="text-sm text-gray-500 mt-1">
                Upload ownership documents, permits, or other legal papers (PDF, JPG)
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Review Your Listing</h3>
              
              <div className="space-y-4">
                <div>
                  <span className="font-medium">Type:</span> {listingData.type === 'sale' ? 'For Sale' : 'For Rent'}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {categories[listingData.category as keyof typeof categories]?.label} - {listingData.subcategory}
                </div>
                <div>
                  <span className="font-medium">Title:</span> {listingData.title}
                </div>
                <div>
                  <span className="font-medium">Price:</span> {listingData.currency} {listingData.price.toLocaleString()}
                  {listingData.type === 'rent' && listingData.rentPeriod && ` per ${listingData.rentPeriod}`}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {listingData.location.address}, {listingData.location.subcity}, {listingData.location.city}
                </div>
                <div>
                  <span className="font-medium">Images:</span> {listingData.images.length} uploaded
                </div>
                <div>
                  <span className="font-medium">Documents:</span> {listingData.documents.length} uploaded
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your listing will be reviewed by our team</li>
                <li>• You'll receive an email notification within 24 hours</li>
                <li>• Once approved, your listing will go live</li>
                <li>• You can edit or delete your listing anytime</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.id
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {currentStep > step.id ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-gray-600">{steps[currentStep - 1].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : prevStep}
          className="flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {currentStep === 1 ? 'Cancel' : 'Previous'}
        </Button>

        <div className="flex space-x-3">
          {currentStep < steps.length ? (
            <Button onClick={nextStep} className="flex items-center">
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex items-center bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Listing'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingWizard;
