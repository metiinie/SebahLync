import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Upload, 
  FileText, 
  Camera, 
  AlertCircle,
  Shield,
  Award,
  Star,
  TrendingUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface SellerVerificationProps {
  onVerificationComplete?: () => void;
}

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  documents?: File[];
}

const SellerVerification: React.FC<SellerVerificationProps> = ({ 
  onVerificationComplete 
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      id: 'identity',
      title: 'Identity Verification',
      description: 'Upload a clear photo of your government-issued ID',
      required: true,
      completed: false
    },
    {
      id: 'address',
      title: 'Address Verification',
      description: 'Upload a utility bill or bank statement showing your address',
      required: true,
      completed: false
    },
    {
      id: 'business',
      title: 'Business Registration (Optional)',
      description: 'Upload business registration documents if you have a registered business',
      required: false,
      completed: false
    },
    {
      id: 'references',
      title: 'References',
      description: 'Provide contact information for 2 professional references',
      required: false,
      completed: false
    }
  ]);

  const [uploading, setUploading] = useState(false);
  const [references, setReferences] = useState([
    { name: '', email: '', phone: '', relationship: '' },
    { name: '', email: '', phone: '', relationship: '' }
  ]);

  const handleFileUpload = (stepId: string, files: File[]) => {
    setVerificationSteps(prev => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, documents: files, completed: files.length > 0 }
          : step
      )
    );
  };

  const handleReferenceChange = (index: number, field: string, value: string) => {
    setReferences(prev => 
      prev.map((ref, i) => 
        i === index ? { ...ref, [field]: value } : ref
      )
    );
  };

  const submitVerification = async () => {
    try {
      setUploading(true);
      
      // TODO: Implement verification submission
      // await UsersService.submitVerification({
      //   steps: verificationSteps,
      //   references: references.filter(ref => ref.name && ref.email)
      // });

      toast.success('Verification submitted successfully! We will review your documents within 24-48 hours.');
      onVerificationComplete?.();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Failed to submit verification. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const getStepStatus = (step: VerificationStep) => {
    if (step.completed) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    if (step.required) {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getCompletionPercentage = () => {
    const completed = verificationSteps.filter(step => step.completed).length;
    const required = verificationSteps.filter(step => step.required).length;
    return Math.round((completed / required) * 100);
  };

  const canSubmit = () => {
    const requiredSteps = verificationSteps.filter(step => step.required);
    return requiredSteps.every(step => step.completed);
  };

  const renderStepContent = (step: VerificationStep) => {
    switch (step.id) {
      case 'identity':
      case 'address':
      case 'business':
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Upload clear, high-quality images of your documents
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  handleFileUpload(step.id, files);
                }}
                className="hidden"
                id={`upload-${step.id}`}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById(`upload-${step.id}`)?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>

            {step.documents && step.documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Uploaded Documents:</h4>
                {step.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium">{doc.name}</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Uploaded
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'references':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Provide contact information for professional references who can vouch for your credibility.
            </p>
            
            {references.map((ref, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Reference {index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={ref.name}
                      onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={ref.email}
                      onChange={(e) => handleReferenceChange(index, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={ref.phone}
                      onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <select
                      value={ref.relationship}
                      onChange={(e) => handleReferenceChange(index, 'relationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select relationship</option>
                      <option value="employer">Employer</option>
                      <option value="colleague">Colleague</option>
                      <option value="client">Client</option>
                      <option value="business_partner">Business Partner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Seller Verification</h1>
              <p className="text-gray-600">
                Get verified to build trust with buyers and access premium features
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Verification Progress</h2>
            <Badge className="bg-blue-100 text-blue-800">
              {getCompletionPercentage()}% Complete
            </Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getCompletionPercentage()}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verificationSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  step.completed 
                    ? 'bg-green-50 border-green-200' 
                    : step.required 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {getStepStatus(step)}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
                {step.required && (
                  <Badge className="bg-red-100 text-red-800 text-xs">Required</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {verificationSteps[currentStep]?.completed ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <Clock className="w-5 h-5 text-gray-400 mr-2" />
            )}
            {verificationSteps[currentStep]?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent(verificationSteps[currentStep])}
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Verification Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Trust Badge</h3>
              <p className="text-sm text-gray-600">
                Display a verified badge on your profile and listings
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Priority Support</h3>
              <p className="text-sm text-gray-600">
                Get faster response times and priority customer support
              </p>
            </div>

            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Higher Visibility</h3>
              <p className="text-sm text-gray-600">
                Your listings appear higher in search results
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <div className="flex space-x-3">
          {currentStep < verificationSteps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(Math.min(verificationSteps.length - 1, currentStep + 1))}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={submitVerification}
              disabled={!canSubmit() || uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? 'Submitting...' : 'Submit Verification'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerVerification;
