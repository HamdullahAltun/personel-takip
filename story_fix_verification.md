# Story Upload Fix Verification

This guide will help you verify the fixes implemented for the Story Upload functionality.

## 1. Prerequisites
- Ensure you are logged in as a staff member or admin.
- Navigate to the Social page (`/social`).

## 2. Test Steps

### A. Upload Valid Image
1. Click on the "Hikaye Ekle" (Add Story) button or your profile circle in the stories bar.
2. Select "Görsel" (Image) type.
3. Click to select an image.
4. Choose a valid JPG, PNG, or WEBP image (under 10MB).
5. Verify that the image preview appears.
6. Click "Paylaş" (Share).
7. **Expected Result**: 
   - A success toast "Hikaye paylaşıldı!" should appear.
   - The dialog should close.
   - Your new story should appear in the story bar (you might need to refresh or it might update automatically).

### B. Upload Large File (>10MB)
1. Repeat the steps above but select an image larger than 10MB.
2. **Expected Result**: 
   - An error toast should appear indicating the file is too large.
   - The upload should be blocked.

### C. Upload Invalid File Type
1. Try to upload a PDF or unsupported file type.
2. **Expected Result**: 
   - An error toast should appear indicating the file format is invalid.

## 3. Troubleshooting
- If you still see errors, check the browser console for "Upload error" logs.
- Check the server logs (terminal) for "Upload blocked - Invalid Type" messages if the type validation is failing on the server side.
