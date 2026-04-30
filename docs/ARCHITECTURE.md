# Multi-Tenant Automation SaaS Architecture

## 1. System Architecture Diagram (Text Representation)

The platform is designed as a multi-tier, multi-tenant architecture prioritizing abstraction, security, and scalability.

```text
[ Client Layer (React/Vite Frontend) ]
    |-- Super Admin Panel (Manage global n8n, integrations, billing, templates)
    |-- Client Dashboard (Manage company data, AI prompts, business logic)

[ API Gateway & Auth Layer (Firebase/Supabase Auth + Edge Functions) ]
    |-- Multi-tenant JWTs, Rate Limiting, Request Routing

[ Application Core (Node.js/TypeScript Backend or Firebase Functions) ]
    |-- Tenant Management Service
    |-- Business Logic Service (Promotions, Company Data)
    |-- Automation Manager (Translates client visual logic to n8n payloads)

[ Integration & Automation Engine (Internal) ]
    |-- n8n (Self-hosted/Cloud) - Master Instance
        |-- Master Workflows (Parameterized per tenant)
        |-- Integration Credentials Manager

[ Distributed Data Layer (Supabase / Postgres with RLS or Firestore) ]
    |-- Tenant Configs
    |-- User & Auth Data
    |-- Automation Logs & Metrics
    |-- External Sync State

[ External World ]
    |-- WhatsApp Business API
    |-- Services (Google Drive, CRMs, etc.)
```

## 2. Data Architecture & Database Schema (Multi-Tenancy)

We utilize **Row-Level Security (RLS)** in PostgreSQL (Supabase) or strict Document Rules (Firestore) to isolate tenant data.

**Key Concepts:**
- `tenant_id` (or `org_id`) is present on *every* operational record.
- **Master Integrations:** Stored without `tenant_id` (or assigned to `system` tenant), only accessible by Platform Admins.
- **Tenant Connections:** Specific OAuth tokens for WhatsApp/Drive tied to `tenant_id`.

**Schema Concept (Relational DB Example):**
```sql
-- Organizations (Tenants)
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR,
  plan VARCHAR,
  active BOOLEAN
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  role VARCHAR (owner, admin, agent)
);

-- AI Knowledge & Prompts
CREATE TABLE agent_instructions (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  trigger_type VARCHAR (e.g., 'customer_inquiry'),
  instruction_text TEXT,
  tone VARCHAR
);

-- Promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  title VARCHAR,
  discount_code VARCHAR,
  start_date TIMESTAMP,
  end_date TIMESTAMP
);

-- System Integrations (Admin Only)
CREATE TABLE system_integrations (
  id UUID PRIMARY KEY,
  provider VARCHAR (n8n, openai),
  api_url VARCHAR,
  encrypted_secret_key VARCHAR
);
```

## 3. Roles and Permissions Structure

The system strictly enforces the Separation of Concerns between platform operators and end-users.

### Platform Admin (Super Admin)
- **Scope:** Entire platform.
- **Capabilities:**
  - Connect global infrastructure (OpenAI keys, n8n webhook URLs, payment gateways).
  - Create global blueprint templates for automations.
  - Monitor aggregate system health and tenant usage limits.
- **Restriction:** Cannot read private client customer data unless explicitly authorized via support token.

### Client Owner (Tenant Admin)
- **Scope:** Single Tenant/Organization.
- **Capabilities:** 
  - Update company profile, branding, and billing.
  - Invite team members (Managers, Agents).
  - Connect pre-approved apps using simple OAuth (e.g., "Connect your WhatsApp").
  - Define high-level AI instructions and business rules (e.g., "If customer asks for discount, offer 10%").
- **Restriction:** Cannot see how the automation is executed under the hood; cannot access raw HTTP nodes, API keys of the platform, or n8n interfaces.

## 4. Integration Flow with n8n

n8n acts as the hidden engine. Clients never see the n8n UI or nodes.

**Workflow Paradigm: Parameterized Master Workflows**
Instead of creating a new n8n workflow for every client, the platform uses Master Workflows triggered by Webhooks.

1. **Trigger Phase:** An event occurs (e.g., a WhatsApp message is received on the client's number).
2. **Gateway Phase:** The message hits the SaaS Platform's generic webhook receiver.
3. **Context Enrichment:** The SaaS backend identifies the `tenant_id` from the incoming number, fetches the tenant's exact configuration (Agent instructions, active promotions, business hours) from the database.
4. **n8n Execution:** The SaaS backend fires a webhook to the internal n8n instance containing the raw event AND the isolated tenant context context.
    ```json
    {
       "tenant_id": "123",
       "event": "new_message",
       "payload": { "text": "I want a discount" },
       "context": {
          "ai_prompt": "You are a helpful assistant for Acme Corp...",
          "active_promos": ["SAVE10"]
       }
    }
    ```
5. **n8n Logic:** n8n uses the injected context to call OpenAI, processes the logic, and calls the appropriate external API (WhatsApp) using the client's specific access token (passed in runtime or fetched from secure vault).

## 5. UX Principles for Client Control Panel

To completely abstract technical complexity, the UI must follow these principles:

1. **State-Driven, Not Flow-Driven UI:**
   Instead of drawing lines between nodes (like Zapier/n8n), clients fill out structured business forms.
   *Example:* "What should happen when a new order is placed?" -> Dropdown: [Send WhatsApp Message] -> Text box: [Enter message template].
   The UI translates this into database configs, which the Master Workflow reads.

2. **Pre-approved App Gallery:**
   A simple "App integrations" page displaying cards (WhatsApp, Google Drive). Clicking them opens a standard OAuth popup. No "API Key" fields unless absolutely necessary.

3. **Natural Language AI Configuration:**
   "Agent Onboarding" feels like interviewing an employee.
   - "What is your company's refund policy?" [Text area]
   - "How should the AI sound?" [Select: Friendly, Professional, Urgent]

4. **Instant Sync Visibility:**
   While the backend instantly syncs configurations to the database and n8n, the user UI should show an immediate "Active" toggle without exposing the compiling/syncing delay.

## 6. Data Flow Explanation

1. **Client Input:** User logs into the SaaS dashboard and sets a new "Welcome Offer" promotion.
2. **Data Storage:** React app posts to `/api/promotions`, which saves to the `promotions` table with RLS ensuring it's locked to `tenant_id`.
3. **Cache/Sync Update:** The backend invalidates any cached configuration for that tenant.
4. **Customer Interaction:** A customer messages the client's WhatsApp.
5. **Inbound Webhook:** WhatsApp triggers the SaaS backend.
6. **Payload Assembly:** Backend dynamically pulls the new "Welcome Offer" from the database.
7. **Action Dispatch:** Backend sends the assembled context to the `n8n` internal engine.
8. **Execution & Log:** n8n executes, replies via WhatsApp API, and sends an execution success log back to the SaaS database.
9. **Metric Display:** Client dashboard reads from the `metrics` table to show "Offers sent: 1" without knowing n8n did the work.
