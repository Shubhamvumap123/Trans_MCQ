import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  acceptedTypes?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  disabled = false,
  acceptedTypes = 'video/mp4,audio/mpeg,audio/wav,video/quicktime'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    const allowedTypes = acceptedTypes.split(',');
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an MP4 or audio file.');
      return;
    }
    
    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File is too large. Maximum size is 500MB.');
      return;
    }
    
    onFileSelect(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : disabled 
              ? 'border-gray-300 bg-gray-50' 
              : 'border-gray-300 hover:border-blue-400 bg-white'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={disabled ? undefined : triggerFileInput}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              triggerFileInput();
            }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept={acceptedTypes}
            disabled={disabled}
            className="hidden"
            aria-hidden="true"
          />
          <div className="flex flex-col items-center justify-center">
            <Upload className="w-12 h-12 text-gray-400 mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold mb-2">Upload Lecture Video</h3>
            <p className="text-gray-500 mb-4 text-center max-w-xs">
              Drag and drop an MP4 or audio file here, or click to select (Max 500MB)
            </p>
            <Button 
              disabled={disabled} 
              variant="outline"
              className="w-full sm:w-auto"
            >
              {disabled ? 'Upload in Progress...' : 'Select Video'}
            </Button>
          </div>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>✓ Supported formats: MP4, MOV, AVI, MP3, WAV</p>
          <p>✓ Maximum file size: 500MB</p>
          <p>✓ Typical processing time: 2-5 minutes</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploader;
            </Button>
            <p className="text-xs text-gray-400 mt-4">Max file size: 500MB. MP4 format only.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUploader;
