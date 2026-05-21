# Aprova — Project Brief

1. Project overview
 - Aprova is a document approval SaaS aimed at Malaysian SMEs, providing document upload, approval workflows, finance and accounting sync features, and role-based user management.

2. Live URLs
 - https://aprova-silk.vercel.app
 - GitHub repo: https://github.com/graysonmy-claude/aprova

3. Tech stack
 - Frontend: React + Vite
 - Backend/Database: Supabase (project: pmpxtpllxigledzcnbxr, region: Singapore)
 - Hosting: Vercel
 - Assist/automation: Claude Code

4. All screens built
 - Dashboard
 - Documents
 - Upload
 - Approvals
 - Finance
 - Acct sync
 - Users
 - Settings
 - Pricing

5. All Supabase tables
 - companies
 - profiles
 - company_members
 - account_codes
 - documents
 - approval_logs
 - payment_records
 - accounting_exports
 - accounting_export_items
 - notifications
 - document_status_log

6. Key features completed
 - Multi-company switching
 - Document upload with image compression
 - Gemini Vision OCR (note: currently needs fixing — returns 400 error)
 - Duplicate detection
 - Approval workflow with approve/reject actions
 - Finance payment workflow with bank slip upload
 - Dual accounting sync tasks (Task 1: post invoices, Task 2: post payments)
 - AutoCount XML and SQL Account CSV export
 - Malaysian account codes convention: 400-XXX for suppliers, 900-XXX for expenses
 - User management with role-based permissions
 - Telegram + WhatsApp + Email notifications (integration work in progress)
 - Responsive mobile layout with bottom navigation
 - Document viewer with lifecycle timeline

7. Subscription plans
 - Starter: RM99
 - Growth: RM249
 - Enterprise: RM599

8. Pending issues
 - Gemini OCR returning 400 Bad Request (API key: AlzaSyBYp8blJq45OUn1al-vNaP-4i2qViv48z8)
 - Vercel deployment blocked when Claude Code pushes (must push manually from own account)
 - Login/signup screen not yet built
 - Real Supabase data not yet wired up (still using demo data)
 - Telegram bot not yet configured
 - Storage buckets not yet created in Supabase

9. Next steps recommended
 - Fix Gemini OCR integration (investigate 400 response and auth/endpoint details)
 - Build login/signup screen using Supabase Auth
 - Wire up real Supabase data queries and remove demo data
 - Create Supabase storage buckets for document file storage
 - Set up Telegram bot and webhook/integration
 - Add Stripe or Billplz payment gateway for subscription handling
 - Move OCR calls to a Supabase Edge Function for improved security

10. Important credentials and config
 - Supabase URL: https://pmpxtpllxigledzcnbxr.supabase.co
 - Supabase anon key: stored in .env as VITE_SUPABASE_ANON_KEY
 - Gemini API key: stored in .env as VITE_GEMINI_API_KEY
 - Local project path: C:\Users\grays\aprova
 - Deployment note: Always push to GitHub manually (not via Claude Code) to avoid Vercel blocking
