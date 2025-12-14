# Quiz Management(iKnowtennis) Backend API

A **production ready RESTful backend API** built with **Node.js, Express, TypeScript and MongoDB**, designed for authentication, quiz category management, subcription model and scalable feature expansion. This project follows clean architecture, proper error handling and industry best practices.

---

## Features

### Authentication & Authorization

- User signup & login
- OTP-based email verification
- Forgot & reset password flow
- Resend OTP
- Secure logout
- Protected routes using middleware

### Quiz Category Management

- Create quiz categories (with image upload)
- Update quiz categories
- Delete quiz categories
- Get all quiz categories
- Get a single quiz category

### Utilities & Enhancements

- Centralized error handling
- Cloudinary integration for image uploads
- Email sending utility
- Role-based access control (Admin)
- Environment-based configuration

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose)
- **Authentication:** JWT
- **File Uploads:** Multer
- **Cloud Storage:** Cloudinary
- **Email Service:** Nodemailer
- **Dev Tools:** Nodemon, Docker

---

## Project Folder Structure

```
src/
├── config/
│   └── db.ts
|   └── index.ts
├── controllers/
│   ├── auth.controller.ts
│   └── quizCategory.controller.ts
├── middlewares/
│   ├── error.handler.ts
│   ├── isAdmin.ts
│   └── isLoggedIn.ts
├── models/
│   ├── user.model.ts
│   ├── quiz.model.ts
│   └── quizCategory.model.ts
├── routes/
│   ├── auth.routes.ts
│   └── quizCategory.routes.ts
├── utils/
│   ├── AppError.ts
│   ├── cloudinary.ts
│   ├── cloudinaryDelete.ts
│   ├── emailTemplates.ts
│   ├── sendEmail.ts
│   └── upload.ts
├── app.ts
└── server.ts

uploads/
.env
.env.example
Dockerfile
package.json
tsconfig.json
```

---

## API Base URL

```
http://localhost:PORT/api/v1
```

---

## Authentication Routes

| Method | Endpoint              | Description             |
| ------ | --------------------- | ----------------------- |
| POST   | /auth/signup          | Register a new user     |
| POST   | /auth/login           | Login user              |
| POST   | /auth/forgot-password | Request password reset  |
| POST   | /auth/resend-otp      | Resend OTP              |
| POST   | /auth/verify-otp      | Verify OTP              |
| POST   | /auth/reset-password  | Reset password          |
| POST   | /auth/logout          | Logout user (Protected) |

---

## Quiz Category Routes

| Method | Endpoint             | Description                         |
| ------ | -------------------- | ----------------------------------- |
| POST   | /quiz-categories     | Create quiz category (Image upload) |
| GET    | /quiz-categories     | Get all quiz categories             |
| GET    | /quiz-categories/:id | Get single quiz category            |
| PUT    | /quiz-categories/:id | Update quiz category                |
| DELETE | /quiz-categories/:id | Delete quiz category                |

---

## Image Upload

- Uses **Multer** for handling file uploads
- Images are stored locally in `uploads/`
- Uploaded to **Cloudinary** for optimized delivery

---

## Environment Variables

Create a `.env` file using `.env.example`

```env
PORT=8000
DATABASE_URI=
ACCESS_SECRET=
REFRESH_SECRET=
SMTP_HOST=
SMTP_USER=
SMTP_PASS=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## Installation & Setup

```bash
# Clone repository
git clone https://github.com/km-saifullah/backend_iknowtennis.git

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Docker Support

```bash
# Build Docker image
docker build -t iknowtennis-image .

# Run container
docker run -p 8000:8000 iknowtennis-image
```

---

## API Testing

- Postman
- Thunder Client
- VS Code Postman Extension

---

## Error Handling

All errors follow a consistent JSON format:

```json
{
  "status": false,
  "message": "Error message here"
}
```

---

## Future Improvements

- Quiz questions & answers module
- User roles & permissions
- Pagination & filtering
- API documentation with Swagger
- Rate limiting & security hardening

---

## Author

**Khaled Md Saifullah**
MERN Stack Developer

---

## 📄 License

This project is licensed under the **MIT License**.
