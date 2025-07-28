# Custom Error Handling System

This document describes the comprehensive custom error handling system implemented in the Nursing Platform application.

## 🎯 Overview

The custom error handling system provides:
- **Type-safe error classes** with specific error codes
- **User-friendly error messages** for better UX
- **Consistent error handling** across the application
- **Automatic error recovery** suggestions
- **Global error monitoring** and reporting

## 📁 File Structure

```
lib/
├── errors.ts           # Custom error classes and types
├── errorHandler.ts     # Error handling utilities
└── setupErrors.ts      # Global error setup and configuration

components/
├── ErrorDisplay.tsx    # Error display components
└── LoginForm.tsx       # Example usage in forms
```

## 🔧 Core Components

### 1. Custom Error Classes (`lib/errors.ts`)

#### Base CustomError Class
```typescript
export class CustomError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly details?: any;
  public readonly timestamp: Date;
}
```

#### Specific Error Types
- **Authentication Errors**: `InvalidCredentialsError`, `TokenExpiredError`, `UnauthorizedError`
- **Validation Errors**: `ValidationError`, `RequiredFieldError`
- **Resource Errors**: `ResourceNotFoundError`, `ResourceAlreadyExistsError`
- **Business Logic Errors**: `ApplicationAlreadySubmittedError`, `NurseNotVerifiedError`
- **Network Errors**: `NetworkError`, `ServerError`, `ServiceUnavailableError`
- **File Upload Errors**: `FileTooLargeError`, `InvalidFileTypeError`

### 2. Error Handler (`lib/errorHandler.ts`)

#### Key Features
- **Singleton pattern** for global error management
- **Error callbacks** for specific error types
- **API error handling** with automatic error creation
- **Network error detection** and handling
- **Retry mechanisms** for failed operations

#### Usage Example
```typescript
import { errorHandler } from '../lib/errorHandler';

// Handle API errors
const customError = await errorHandler.handleApiError(response);

// Register error callbacks
errorHandler.onError(ErrorCode.INVALID_CREDENTIALS, (error) => {
  // Handle invalid credentials
});
```

### 3. Error Display Components (`components/ErrorDisplay.tsx`)

#### Main ErrorDisplay Component
```typescript
<ErrorDisplay 
  error={error} 
  className="mb-6"
  showDetails={true}
  onRetry={() => retryOperation()}
  onDismiss={() => setError(null)}
/>
```

#### InlineError Component
```typescript
<InlineError error={fieldError} className="mt-1" />
```

#### ErrorToast Component
```typescript
<ErrorToast 
  error={error} 
  onDismiss={() => setError(null)}
  duration={5000}
/>
```

## 🚀 Usage Examples

### 1. API Service Integration

```typescript
// In API service methods
try {
  const response = await fetch('/api/endpoint');
  if (!response.ok) {
    const customError = await errorHandler.handleApiError(response);
    throw customError;
  }
  return await response.json();
} catch (error) {
  throw errorHandler.handleError(error);
}
```

### 2. Form Validation

```typescript
const handleSubmit = async (formData) => {
  try {
    // Validate form
    if (!formData.email) {
      throw new RequiredFieldError('Email');
    }
    
    // Submit form
    await apiService.submitForm(formData);
  } catch (error) {
    const customError = errorHandler.handleError(error);
    setError(customError);
  }
};
```

### 3. Component Error Handling

```typescript
const [error, setError] = useState<CustomError | null>(null);

// In your component
{error && (
  <ErrorDisplay 
    error={error}
    onDismiss={() => setError(null)}
    onRetry={() => {
      setError(null);
      retryOperation();
    }}
  />
)}
```

## 🎨 Error Types and Messages

### Authentication Errors
- **Invalid Credentials**: "Invalid email or password. Please check your credentials and try again."
- **Token Expired**: "Your session has expired. Please log in again."
- **Unauthorized**: "You are not authorized to perform this action."

### Validation Errors
- **Required Field**: "Email is required. Please provide this information."
- **Invalid Format**: "Please enter a valid email address."

### Business Logic Errors
- **Already Applied**: "You have already applied to this request."
- **Nurse Not Verified**: "Your nurse account needs to be verified before you can apply to requests."

### Network Errors
- **Connection Failed**: "Unable to connect to the server. Please check your internet connection."
- **Server Error**: "Something went wrong on our end. Please try again later."

## 🔄 Error Recovery

The system provides automatic recovery suggestions:

```typescript
// Get recovery actions for an error
const actions = getRecoveryActions(error);
actions.forEach(action => {
  console.log(`Suggested action: ${action.label}`);
  // action.action() - Execute the recovery action
});
```

## 📊 Error Monitoring

### Development
- Console logging with detailed error information
- Error statistics and system status
- Stack traces and debugging information

### Production Ready
- Error reporting service integration (Sentry, LogRocket, etc.)
- User-friendly error messages
- Automatic error recovery attempts

## 🛠️ Setup and Configuration

### 1. Initialize Error Handling
```typescript
// In _app.tsx or main entry point
import '../lib/setupErrors';
```

### 2. Register Custom Error Handlers
```typescript
import { errorHandler, ErrorCode } from '../lib/errorHandler';

errorHandler.onError(ErrorCode.INVALID_CREDENTIALS, (error) => {
  // Custom handling for invalid credentials
  redirectToLogin();
});
```

### 3. Global Error Boundaries
```typescript
// React Error Boundary integration
const customError = withErrorBoundary(error, errorInfo);
```

## 🎯 Best Practices

### 1. Always Use Custom Errors
```typescript
// ❌ Don't throw generic errors
throw new Error('Something went wrong');

// ✅ Use specific custom errors
throw new InvalidCredentialsError();
```

### 2. Provide User-Friendly Messages
```typescript
// ❌ Technical error messages
"HTTP 401: Unauthorized"

// ✅ User-friendly messages
"Your session has expired. Please log in again."
```

### 3. Include Recovery Actions
```typescript
<ErrorDisplay 
  error={error}
  onRetry={() => retryOperation()}
  onDismiss={() => setError(null)}
/>
```

### 4. Handle Errors at the Right Level
- **Field-level**: Use `InlineError` for form validation
- **Component-level**: Use `ErrorDisplay` for component errors
- **Global-level**: Use `ErrorToast` for system-wide notifications

## 🔍 Debugging

### Error Information
Each custom error includes:
- **Error Code**: Specific identifier for the error type
- **User Message**: Human-readable error description
- **Technical Message**: Detailed error information for debugging
- **Status Code**: HTTP status code (for API errors)
- **Details**: Additional context and debugging information
- **Timestamp**: When the error occurred

### Console Output
```javascript
// Error Report: {
//   name: "CustomError",
//   code: "INVALID_CREDENTIALS",
//   message: "Invalid email or password provided",
//   userMessage: "Invalid email or password. Please check your credentials and try again.",
//   statusCode: 401,
//   timestamp: "2024-01-15T10:30:00.000Z",
//   stack: "..."
// }
```

## 🚀 Future Enhancements

1. **Error Analytics**: Track error patterns and frequencies
2. **A/B Testing**: Test different error messages for better UX
3. **Internationalization**: Multi-language error messages
4. **Smart Recovery**: AI-powered error recovery suggestions
5. **Performance Monitoring**: Track error impact on app performance

This error handling system provides a robust foundation for managing errors throughout the application while maintaining excellent user experience.
