import React, { useState } from 'react';

interface Image {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  uploadedAt?: string;
}

interface ImageGalleryProps {
  images: Image[];
  title?: string;
  allowDelete?: boolean;
  onDelete?: (index: number) => void;
  className?: string;
}

export default function ImageGallery({
  images,
  title = "Images",
  allowDelete = false,
  onDelete,
  className = "",
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = (index: number) => {
    setSelectedImage(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (selectedImage !== null && selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const handleDelete = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(index);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <div 
              className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openModal(index)}
            >
              <img
                src={image.url}
                alt={image.originalName}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
              />
            </div>
            
            {/* Delete Button */}
            {allowDelete && (
              <button
                type="button"
                onClick={(e) => handleDelete(index, e)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            )}
            
            {/* Image Info */}
            <div className="mt-1">
              <p className="text-xs text-gray-600 truncate" title={image.originalName}>
                {image.originalName}
              </p>
              <p className="text-xs text-gray-400">
                {(image.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Click on images to view in full size • {images.length} image{images.length > 1 ? 's' : ''}
      </p>

      {/* Modal */}
      {isModalOpen && selectedImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close Button */}
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-colors z-10"
            >
              ×
            </button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  disabled={selectedImage === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  disabled={selectedImage === images.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-75 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={images[selectedImage].url}
              alt={images[selectedImage].originalName}
              className="max-w-full max-h-full object-contain"
            />

            {/* Image Info */}
            <div className="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 rounded-lg p-3">
              <p className="font-medium">{images[selectedImage].originalName}</p>
              <p className="text-sm opacity-75">
                {(images[selectedImage].size / 1024 / 1024).toFixed(1)} MB
                {images.length > 1 && (
                  <span className="ml-2">
                    {selectedImage + 1} of {images.length}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10"
            onClick={closeModal}
          />
        </div>
      )}
    </div>
  );
}
