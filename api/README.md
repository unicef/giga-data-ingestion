# Data Ingestion

You will need to manually fill out the following environment variables.

## Environment Variables

### EMAIL_TEST_RECIPIENTS
- **Purpose**: Defines test email recipients for the email service
- **Format**: Comma-separated list of email addresses
- **Example**: `"test1@example.com,test2@example.com"`
- **Usage**: Used during development and testing to send email notifications to specific recipients instead of actual users

### ADMIN_EMAIL
- **Purpose**: Designates admin user(s) upon first application startup
- **Format**: Single email or comma-separated list in brackets format
- **Example**: `"admin@example.com"` or `["admin1@example.com","admin2@example.com"]`
- **Usage**: Users with these email addresses will automatically receive admin privileges when they first log into the application

### LAKEHOUSE_USERNAME
- **Purpose**: Creates a prefixed lakehouse folder for file uploads
- **Format**: String username/identifier
- **Example**: `"dev-user"` or `"staging"`
- **Usage**: The API uploads files to a folder named `lakehouse-local-{LAKEHOUSE_USERNAME}`. The dev environment uses the non-prefixed `lakehouse` folder by default when this variable is empty
