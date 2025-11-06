'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'

interface Slide {
  title: string
  content: string[]
  layout: 'TITLE' | 'TITLE_CONTENT' | 'SECTION_HEADER'
}

interface SlidePreviewProps {
  slides: Slide[]
  currentPreview: string
  onSlidesUpdate: (slides: Slide[]) => void
}

export default function SlidePreview({ slides, currentPreview, onSlidesUpdate }: SlidePreviewProps) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')

  const currentSlide = slides[currentSlideIndex]

  const handleEdit = () => {
    if (currentSlide) {
      setEditContent(currentSlide.content.join('\n'))
      setIsEditing(true)
    }
  }

  const handleSave = () => {
    if (currentSlide) {
      const updatedSlides = [...slides]
      updatedSlides[currentSlideIndex] = {
        ...currentSlide,
        content: editContent.split('\n').filter(line => line.trim())
      }
      onSlidesUpdate(updatedSlides)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (slides.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center mx-auto mb-4">
            <div className="text-4xl">📊</div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No presentation yet</h3>
          <p className="text-gray-500 max-w-sm">
            Start a conversation to create your first PowerPoint presentation!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        {currentPreview ? (
          <div className="w-full h-full max-w-4xl max-h-[600px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <iframe
              src={currentPreview}
              className="w-full h-full border-0"
              title="Presentation Preview"
            />
          </div>
        ) : (
          <div className="w-full max-w-4xl h-[600px] bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            {currentSlide && (
              <div className="h-full flex flex-col">
                {/* Slide Title */}
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">
                  {currentSlide.title}
                </h2>
                
                {/* Slide Content */}
                <div className="flex-1 flex items-center justify-center">
                  {isEditing ? (
                    <div className="w-full max-w-2xl">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter slide content (one point per line)"
                      />
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-2xl">
                      {currentSlide.content.map((point, index) => (
                        <div key={index} className="flex items-start mb-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0" />
                          <p className="text-lg text-gray-700">{point}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-sm font-medium text-gray-700">
              Slide {currentSlideIndex + 1} of {slides.length}
            </span>
            
            <button
              onClick={() => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === slides.length - 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {!currentPreview && (
            <button
              onClick={isEditing ? handleSave : handleEdit}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Edit Slide'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}