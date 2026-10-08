import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const canvasRef = useRef(null);
    const [image, setImage] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            setImage(img);
            // Center the image initially
            const minScale = Math.max(200 / img.width, 200 / img.height);
            setScale(minScale);
            setPosition({
                x: (200 - img.width * minScale) / 2,
                y: (200 - img.height * minScale) / 2
            });
        };
    }, [imageSrc]);

    useEffect(() => {
        if (image && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw background
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw image with current scale and position
            ctx.drawImage(
                image,
                position.x,
                position.y,
                image.width * scale,
                image.height * scale
            );
            
            // Draw cropping circle overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.beginPath();
            ctx.rect(0, 0, canvas.width, canvas.height);
            ctx.arc(100, 100, 100, 0, Math.PI * 2, true);
            ctx.fill();
        }
    }, [image, scale, position]);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleCrop = () => {
        if (!image) return;
        
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = 800;
        cropCanvas.height = 800;
        const ctx = cropCanvas.getContext('2d');
        
        // Calculate the crop ratio
        const scaleFactor = 800 / 200;
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 800, 800);
        
        ctx.drawImage(
            image,
            (position.x) * scaleFactor,
            (position.y) * scaleFactor,
            image.width * scale * scaleFactor,
            image.height * scale * scaleFactor
        );
        
        // Output as base64 data URL so we can store it in the DB (no filesystem dependency)
        const dataUrl = cropCanvas.toDataURL('image/jpeg', 0.85);
        onCropComplete(dataUrl);

    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div 
                className="relative cursor-move rounded-xl overflow-hidden border border-white/10"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas
                    ref={canvasRef}
                    width={200}
                    height={200}
                    className="bg-black touch-none"
                />
            </div>
            
            <div className="flex items-center gap-4 w-full px-4">
                <ZoomOut size={18} className="text-text-muted" />
                <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.01"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="flex-1 accent-primary"
                />
                <ZoomIn size={18} className="text-text-muted" />
            </div>

            <div className="flex gap-3 mt-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 rounded-lg border border-border-color hover:bg-bg-hover text-text-primary text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <X size={16} /> Cancel
                </button>
                <button
                    onClick={handleCrop}
                    className="btn-primary text-sm font-bold uppercase tracking-widest flex items-center gap-2"
                >
                    <Check size={16} /> Apply Crop
                </button>
            </div>
        </div>
    );
};

export default ImageCropper;
