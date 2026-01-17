# Cloudinary Setup Guide

## Configuration Details
- **Cloud Name**: `dhqctdrht`
- **API Key**: `678784814319173`

## Setup Steps

### 1. Create Upload Preset (REQUIRED)
1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Navigate to **Settings** > **Upload**
3. Scroll down to **Upload presets**
4. Click **Add upload preset**
5. Configure:
   - **Preset name**: `blogging` (MUST match exactly)
   - **Signing Mode**: **Unsigned** (IMPORTANT!)
   - **Folder**: `profile-photos` (optional)
   - **Allowed formats**: `jpg,png,gif,webp`
   - **Max file size**: `10000000` (10MB)
   - **Max image width**: `2000`
   - **Max image height**: `2000`
6. Click **Save**

### 2. Verify Upload Preset
After creating, verify:
- Preset name is exactly: `blogging`
- Signing mode is: `Unsigned`
- Status is: `Enabled`

### 3. Test Upload
Use the test page to verify:
```
http://localhost:8000/cloudinary-test.html
```

## Common Errors & Solutions

### Error: "Upload preset not found"
**Solution:** 
- Create upload preset named `blogging` in Cloudinary console
- Make sure it's set to "Unsigned" mode
- Wait 1-2 minutes after creating for it to activate

### Error: "Invalid signature"
**Solution:**
- Change signing mode to "Unsigned"
- Don't send API key for unsigned uploads

### Error: "File size too large"
**Solution:**
- Check file is under 10MB
- Increase max file size in upload preset settings

### Error: "Invalid file type"
**Solution:**
- Only use: JPG, PNG, GIF, WebP
- Add allowed formats in upload preset

### 3. Security Settings (Optional)
For production, consider:
- **Restricted access**: Enable in Cloudinary settings
- **Allowed domains**: Add your domain
- **Rate limiting**: Configure upload limits

## Features Implemented

### ✅ Image Upload
- Direct upload to Cloudinary from browser
- File validation (type, size)
- Progress indication
- Error handling

### ✅ Image Optimization
- Automatic format conversion (WebP when supported)
- Quality optimization
- Responsive sizing
- Crop and resize transformations

### ✅ Profile Photos
- 150x150px optimized for profile display
- 100x100px for author pages
- Automatic cropping to square
- Fallback to placeholder if no image

## Usage in Code

### Upload Image
```javascript
import { uploadImageToCloudinary } from './js/cloudinary.js';

const result = await uploadImageToCloudinary(file);
if (result.success) {
    console.log('Image URL:', result.url);
    console.log('Public ID:', result.publicId);
}
```

### Get Optimized URL
```javascript
import { getProfilePhotoUrl } from './js/cloudinary.js';

const optimizedUrl = getProfilePhotoUrl(publicId, 150);
```

### Custom Transformations
```javascript
import { getCloudinaryUrl } from './js/cloudinary.js';

const customUrl = getCloudinaryUrl(publicId, {
    width: 300,
    height: 200,
    crop: 'fill',
    quality: 'auto'
});
```

## Benefits Over Firebase Storage

1. **Better Performance**: Global CDN with automatic optimization
2. **Advanced Transformations**: Resize, crop, format conversion on-the-fly
3. **Cost Effective**: Generous free tier
4. **Easy Integration**: Direct browser uploads
5. **Automatic Optimization**: WebP conversion, quality adjustment
6. **No Backend Required**: Unsigned uploads for public images

## Troubleshooting

### Upload Preset Not Found
- Ensure upload preset exists in Cloudinary console
- Check preset name matches in `js/cloudinary.js`
- Verify preset is set to "Unsigned"

### CORS Issues
- Cloudinary automatically handles CORS for uploads
- No additional configuration needed

### File Size Limits
- Default limit is 5MB
- Increase in upload preset settings if needed
- Client-side validation in `js/utils.js`

### Image Not Displaying
- Check if public_id is correctly stored in Firestore
- Verify Cloudinary cloud name is correct
- Check browser network tab for failed requests