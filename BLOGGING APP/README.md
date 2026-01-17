# Blog App - Firebase Authentication & Firestore

A complete blog application built with HTML5, CSS3, JavaScript, Bootstrap 5, and Firebase services.

## Features

### Authentication
- ✅ Email/Password signup and login with HTML5 validation
- ✅ Google Authentication integration
- ✅ Automatic redirect for authenticated users
- ✅ Password requirements: 8+ characters with uppercase and lowercase
- ✅ Name validation: First name 3-20 chars, Last name 1-20 chars

### Dashboard (Authenticated Users)
- ✅ Create new blog posts with validation (title: 5-200 chars, content: 100-10,000 chars)
- ✅ View all user's blog posts sorted by date (latest first)
- ✅ Edit existing blog posts
- ✅ Delete blog posts with confirmation dialog
- ✅ Character counter for both title and content
- ✅ User name display and logout functionality

### Profile Management
- ✅ Update profile photo (upload to Cloudinary with optimization)
- ✅ Edit first name and last name
- ✅ Change password with validation
- ✅ Optimized profile photo display with automatic resizing

### Public Features (No Login Required)
- ✅ View all blogs from all users (latest first)
- ✅ Time-based greeting (Good Morning/Afternoon/Evening/Night)
- ✅ Click author name to see all their blogs
- ✅ Author page with profile info and all their posts
- ✅ Responsive design with Bootstrap 5

## Setup Instructions

### 1. Firebase Configuration
Your Firebase project is already configured in `firebaseconfig.js`. Make sure these services are enabled in your Firebase console:

- **Authentication**: Enable Email/Password and Google providers
- **Firestore Database**: Create database in production mode

### 2. Cloudinary Configuration
Image uploads use Cloudinary instead of Firebase Storage:

- **Cloud Name**: `dhqctdrht`
- **API Key**: `678784814319173`

**Setup Steps:**
1. Go to [Cloudinary Console](https://cloudinary.com/console)
2. Create an unsigned upload preset named `ml_default`
3. Configure allowed formats: jpg, png, gif, webp
4. Set max file size to 5MB

See `CLOUDINARY_SETUP.md` for detailed instructions.

### 2. Firestore Security Rules
Add these rules to your Firestore Database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read blogs, only authenticated users can write
    match /blogs/{blogId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 3. Google Authentication Setup
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable Google provider
3. Add your domain to authorized domains
4. For local development, add `localhost` to authorized domains

### 4. Local Development
1. Serve the files using a local web server (required for Firebase modules):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

2. Open `http://localhost:8000` in your browser

### 5. Deployment
Deploy to any static hosting service:
- **Firebase Hosting**: `firebase deploy`
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your GitHub repository
- **GitHub Pages**: Push to a repository and enable Pages

## File Structure

```
├── index.html          # Home page (public blog listing)
├── signup.html         # User registration
├── login.html          # User login
├── dashboard.html      # User dashboard (authenticated)
├── profile.html        # Profile management (authenticated)
├── author.html         # Author's blog listing
├── styles.css          # Custom CSS styles
├── firebaseconfig.js   # Firebase configuration
├── js/
│   ├── auth.js         # Authentication utilities
│   ├── blog.js         # Blog management utilities
│   ├── cloudinary.js   # Cloudinary image upload utilities
│   ├── utils.js        # General utility functions
│   ├── home.js         # Home page functionality
│   ├── signup.js       # Signup page functionality
│   ├── login.js        # Login page functionality
│   ├── dashboard.js    # Dashboard functionality
│   ├── profile.js      # Profile management
│   └── author.js       # Author page functionality
└── README.md           # This file
```

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Backend**: Firebase Authentication, Firestore Database
- **Image Storage**: Cloudinary with automatic optimization
- **Validation**: HTML5 form validation with custom JavaScript
- **Responsive**: Bootstrap 5 responsive grid system

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Security Features

- HTML5 form validation
- Firebase security rules
- XSS protection with HTML escaping
- File upload validation
- Authentication state management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.