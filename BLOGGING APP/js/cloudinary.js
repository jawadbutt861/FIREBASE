// Cloudinary configuration and utilities
const CLOUDINARY_CONFIG = {
    cloudName: 'dhqctdrht',
    uploadPreset: 'blogging' // Make sure this preset exists and is set to "unsigned" in Cloudinary
};

// Cloudinary upload function with detailed error handling
export async function uploadImageToCloudinary(file) {
    console.log('📤 Starting Cloudinary upload...');
    console.log('File details:', {
        name: file.name,
        type: file.type,
        size: file.size,
        sizeKB: (file.size / 1024).toFixed(2) + ' KB'
    });
    
    try {
        // Validate file before upload
        if (!file) {
            throw new Error('No file provided');
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('File size exceeds 10MB limit');
        }
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Invalid file type. Use JPG, PNG, GIF, or WebP');
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
        
        console.log('📡 Sending request to Cloudinary...');
        console.log('Config:', {
            cloudName: CLOUDINARY_CONFIG.cloudName,
            uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
            endpoint: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`
        });
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
            method: 'POST',
            body: formData
        });
        
        console.log('📥 Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (!response.ok) {
            console.error('❌ Cloudinary error response:', data);
            
            // Provide helpful error messages
            let errorMessage = data.error?.message || `Upload failed: ${response.statusText}`;
            
            if (errorMessage.includes('preset')) {
                errorMessage += '\n\n💡 Solution: Create upload preset "blogging" in Cloudinary Console (Settings → Upload → Upload presets). Make sure it\'s set to "Unsigned" mode.';
            } else if (errorMessage.includes('signature')) {
                errorMessage += '\n\n💡 Solution: Change preset to "Unsigned" mode in Cloudinary Console.';
            }
            
            throw new Error(errorMessage);
        }
        
        console.log('✅ Upload successful!');
        console.log('Public ID:', data.public_id);
        console.log('URL:', data.secure_url);
        
        return {
            success: true,
            url: data.secure_url,
            publicId: data.public_id,
            data: data
        };
    } catch (error) {
        console.error('❌ Upload error:', error);
        console.error('Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack
        });
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Generate Cloudinary URL with transformations
export function getCloudinaryUrl(publicId, transformations = {}) {
    const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
    
    let transformString = '';
    
    // Common transformations
    if (transformations.width) transformString += `w_${transformations.width},`;
    if (transformations.height) transformString += `h_${transformations.height},`;
    if (transformations.crop) transformString += `c_${transformations.crop},`;
    if (transformations.quality) transformString += `q_${transformations.quality},`;
    if (transformations.format) transformString += `f_${transformations.format},`;
    
    // Remove trailing comma
    transformString = transformString.replace(/,$/, '');
    
    if (transformString) {
        return `${baseUrl}/${transformString}/${publicId}`;
    } else {
        return `${baseUrl}/${publicId}`;
    }
}

// Get optimized profile photo URL
export function getProfilePhotoUrl(publicId, size = 150) {
    if (!publicId) return 'https://via.placeholder.com/150';
    
    return getCloudinaryUrl(publicId, {
        width: size,
        height: size,
        crop: 'fill',
        quality: 'auto',
        format: 'auto'
    });
}

// Delete image from Cloudinary (requires backend or signed request)
export async function deleteImageFromCloudinary(publicId) {
    try {
        // For client-side deletion, we need to use Cloudinary's unsigned delete
        // This requires the upload preset to allow deletion
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/destroy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                public_id: publicId,
                upload_preset: CLOUDINARY_CONFIG.uploadPreset
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            return { success: true, result };
        } else {
            // If deletion fails, don't throw error as it's not critical
            console.warn('Could not delete image from Cloudinary:', publicId);
            return { success: false, error: 'Deletion not supported' };
        }
    } catch (error) {
        // Log but don't fail the main operation
        console.warn('Cloudinary deletion error:', error);
        return { success: false, error: error.message };
    }
}