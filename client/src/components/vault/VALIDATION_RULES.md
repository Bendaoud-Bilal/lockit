# AddItemModal Validation Rules

## ✅ **All Categories**

- **Title**: Required (cannot be empty)

---

## 🔐 **Login Category**

### Required Fields:

- **Title**: Required
- **Username OR Email**: At least one is required
- **Password**: Required

### Optional Fields:

- **Website**: Optional (validated if provided)
- **Notes**: Optional

### Validation Rules:

1. **Email**: Must be valid email format (`user@example.com`)
2. **Website**: Must start with `http://` or `https://`
3. **Password**: Must not be empty

### Error Messages:

- Title: "Title is required"
- Username/Email: "Username or Email is required"
- Email: "Invalid email format"
- Password: "Password is required"
- Website: "Invalid URL format (must start with http:// or https://)"

---

## 💳 **Credit Card Category**

### Required Fields:

- **Title**: Required
- **Cardholder Name**: Required
- **Card Number**: Required (13-19 digits)
- **Expiry Month**: Required (01-12)
- **Expiry Year**: Required (4 digits, current year or future)
- **CVV**: Required (3-4 digits)

### Optional Fields:

- **Notes**: Optional

### Validation Rules:

1. **Card Number**:

   - Must contain only digits
   - Must be 13-19 characters long
   - Spaces are automatically removed for validation

2. **Expiry Month**:

   - Format: `MM` (01-12)
   - Must be 2 digits
   - Valid range: 01 to 12

3. **Expiry Year**:

   - Format: `YYYY` (e.g., 2025)
   - Must be 4 digits
   - Cannot be in the past

4. **CVV**:
   - Must be 3 or 4 digits
   - Numbers only

### Error Messages:

- Title: "Title is required"
- Cardholder Name: "Cardholder name is required"
- Card Number:
  - Empty: "Card number is required"
  - Invalid: "Card number must be 13-19 digits"
- Expiry Month:
  - Empty: "Expiry month is required"
  - Invalid: "Invalid month (01-12)"
- Expiry Year:
  - Empty: "Expiry year is required"
  - Invalid: "Year must be 4 digits"
  - Expired: "Card is expired"
- CVV:
  - Empty: "CVV is required"
  - Invalid: "CVV must be 3-4 digits"

---

## 📝 **Secure Note Category**

### Required Fields:

- **Title**: Required
- **Content**: Required (main note content)

### Optional Fields:

- **Notes**: Optional (additional notes)

### Validation Rules:

1. **Content**: Must not be empty (whitespace is trimmed)

### Error Messages:

- Title: "Title is required"
- Content: "Content is required"

---

## 🎨 **Visual Indicators**

### Required Field Marker:

- Red asterisk (`*`) appears next to required field labels

### Error States:

- **Border**: Red border on invalid fields (`border-red-500`)
- **Message**: Red text below field showing specific error
- **Clearing**: Errors clear automatically when user starts typing

### Error Display Pattern:

```jsx
{
  errors.fieldName && (
    <p className="text-red-500 text-xs mt-1">{errors.fieldName}</p>
  );
}
```

---

## 🔄 **Validation Flow**

1. **User fills form**
2. **User clicks "Save Item"**
3. **`validateForm()` function runs**
4. **If validation fails:**
   - Errors are set in state
   - Alert shows: "Please fix the errors in the form"
   - Red borders appear on invalid fields
   - Error messages display below fields
   - Save is prevented
5. **If validation passes:**
   - Form data is encrypted
   - Data is sent to API

---

## 📋 **Examples**

### ✅ Valid Login:

```javascript
{
  title: "GitHub Account",
  category: "Login",
  username: "johndoe",
  email: "john@example.com",
  password: "MySecurePassword123!",
  website: "https://github.com",
  notes: "My main account"
}
```

### ✅ Valid Credit Card:

```javascript
{
  title: "Visa Card",
  category: "Credit Card",
  cardholderName: "John Doe",
  cardNumber: "4532123456789012",
  expiryMonth: "12",
  expiryYear: "2026",
  cvv: "123",
  notes: "Primary card"
}
```

### ✅ Valid Secure Note:

```javascript
{
  title: "WiFi Passwords",
  category: "Note",
  content: "Home WiFi: MyPassword123\nGuest WiFi: GuestPass456",
  notes: "Updated Oct 2025"
}
```

### ❌ Invalid Examples:

**Login - Missing Password:**

```javascript
{
  title: "GitHub",
  username: "john",
  password: "",  // ❌ Error: "Password is required"
}
```

**Credit Card - Invalid Card Number:**

```javascript
{
  cardNumber: "1234",  // ❌ Error: "Card number must be 13-19 digits"
}
```

**Credit Card - Expired:**

```javascript
{
  expiryYear: "2023",  // ❌ Error: "Card is expired"
}
```

---

## 🛠️ **Implementation Details**

### Validation Function Location:

`/client/src/components/vault/AddItemModal.jsx` - Line ~30

### State Management:

```javascript
const [errors, setErrors] = useState({});
```

### Clear Error on Change:

```javascript
onChange={(e) => {
  setFormData({ ...formData, fieldName: e.target.value });
  if (errors.fieldName) setErrors({ ...errors, fieldName: '' });
}}
```

This ensures a smooth user experience where errors disappear as soon as the user starts correcting them.
