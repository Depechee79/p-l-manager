# Document Recognition Contract

> Source of truth for all document recognition, OCR, and automated data extraction
> in the P&L Manager project. This is a core differentiator of the product.

---

## Table of Contents

1. [Technology Decision](#technology-decision)
2. [Architecture](#architecture)
3. [Document Types](#document-types)
4. [Extraction Schema](#extraction-schema)
5. [Confidence Levels](#confidence-levels)
6. [Human Review](#human-review)
7. [Validation and Cross-Reference](#validation-and-cross-reference)
8. [Error Handling](#error-handling)
9. [Cloud Function Implementation](#cloud-function-implementation)
10. [UI: Mobile Capture](#ui-mobile-capture)
11. [Cost Management](#cost-management)
12. [Privacy and Security](#privacy-and-security)
13. [Testing](#testing)
14. [Future Enhancements](#future-enhancements)

---

## Technology Decision

### Chosen: Claude API Vision (via Cloud Functions)

| Option          | Status       | Rationale                                          |
| --------------- | ------------ | -------------------------------------------------- |
| Claude Vision   | **CHOSEN**   | Understands context, Spanish formats, handwriting  |
| Tesseract.js    | **REJECTED** | Generic OCR, no context understanding              |
| Google Vision   | **REJECTED** | Good OCR, but no document understanding            |
| AWS Textract    | **REJECTED** | Overkill infrastructure, not Firebase-native        |

### Why Claude Vision

Traditional OCR (Tesseract, Google Vision) reads text character by character.
It does not understand that "3 x Lomo iberico @ 12,50" means 3 units of a product
at 12.50 EUR each. Claude Vision understands:

- **Document structure**: headers, line items, totals, tax sections
- **Spanish formats**: commas as decimal separators, NIF/CIF, IVA percentages
- **Messy input**: poorly printed thermal receipts, handwritten delivery notes
- **Implicit context**: "Dto. 5%" means a 5% discount, "s/cargo" means no charge
- **Unit inference**: "2 kg lomo" vs "2 uds lomo" (kilograms vs units)
- **VAT logic**: line-item VAT, mixed rates (4%, 10%, 21%), VAT-inclusive prices

---

## Architecture

### Data Flow

```
+------------------+     +-------------------+     +------------------+
| Mobile Camera    | --> | Cloud Function    | --> | Structured JSON  |
| or File Upload   |     | (Anthropic SDK)   |     | (extraction)     |
+------------------+     +-------------------+     +------------------+
                                                          |
                                                          v
                                                   +------------------+
                                                   | Human Review UI  |
                                                   | (verify/correct) |
                                                   +------------------+
                                                          |
                                                          v
                                                   +------------------+
                                                   | Firestore        |
                                                   | (final storage)  |
                                                   +------------------+
```

### Step-by-Step Flow

1. **Capture**: User takes photo (mobile) or uploads file (desktop)
2. **Upload**: Image sent to Cloud Storage (temporary bucket)
3. **Process**: Cloud Function receives trigger, calls Claude Vision API
4. **Extract**: Claude returns structured JSON with confidence scores
5. **Review**: User sees extracted data in review UI, corrects if needed
6. **Save**: User confirms, data saved to Firestore
7. **Cleanup**: Raw image deleted from Cloud Storage after processing

### Architecture Rules

| Rule                                          | Rationale                              |
| --------------------------------------------- | -------------------------------------- |
| Processing happens in Cloud Function          | API key stays server-side              |
| Raw images are temporary (not long-term)      | Privacy, storage costs                 |
| Human review is ALWAYS required               | Financial data demands accuracy        |
| Extraction JSON follows strict schema         | Consistent downstream processing       |
| Client never calls Anthropic API directly     | Security: no API key in browser        |

---

## Document Types

### Supported Documents

| Type                  | Spanish Name    | Identifier    | Priority |
| --------------------- | --------------- | ------------- | -------- |
| Invoice               | Factura         | `factura`     | High     |
| Delivery Note         | Albaran         | `albaran`     | High     |
| Receipt/Ticket        | Ticket          | `ticket`      | Medium   |
| Cash Closing          | Cierre de caja  | `cierre`      | Medium   |

### Document Identification

Claude Vision identifies the document type automatically from the content.
The user can override if the auto-detection is wrong.

```typescript
type DocumentType = "factura" | "albaran" | "ticket" | "cierre";
```

---

## Extraction Schema

### Common Fields (All Document Types)

```typescript
interface BaseExtraction {
  documentType: DocumentType;
  confidence: ConfidenceLevel;
  supplier: {
    name: string;
    nif: string | null;        // NIF/CIF
    confidence: ConfidenceLevel;
  };
  date: {
    value: string;             // ISO 8601 (YYYY-MM-DD)
    original: string;          // As printed on document
    confidence: ConfidenceLevel;
  };
  documentNumber: {
    value: string | null;      // Invoice/delivery note number
    confidence: ConfidenceLevel;
  };
}
```

### Line Items

```typescript
interface ExtractedLineItem {
  description: string;
  quantity: number;
  unit: string;                // "kg", "ud", "l", "caja"
  unitPrice: number;           // Price per unit (EUR)
  totalPrice: number;          // quantity * unitPrice
  vatRate: number | null;      // 4, 10, 21 (percentage)
  discount: number | null;     // Discount percentage or amount
  confidence: ConfidenceLevel;
}
```

### Invoice-Specific Fields

```typescript
interface InvoiceExtraction extends BaseExtraction {
  documentType: "factura";
  items: ExtractedLineItem[];
  subtotal: number;
  vatBreakdown: VATBreakdown[];
  totalWithVAT: number;
  paymentMethod: string | null;  // "transferencia", "efectivo", "domiciliacion"
  dueDate: string | null;        // ISO 8601
}

interface VATBreakdown {
  rate: number;          // 4, 10, or 21
  base: number;          // Taxable amount
  amount: number;        // VAT amount
  confidence: ConfidenceLevel;
}
```

### Delivery Note-Specific Fields

```typescript
interface AlbaranExtraction extends BaseExtraction {
  documentType: "albaran";
  items: ExtractedLineItem[];
  subtotal: number | null;     // Some albaranes don't have prices
  hasPrices: boolean;          // Whether prices are included
  deliveryPerson: string | null;
  receivedBy: string | null;
}
```

### Receipt-Specific Fields

```typescript
interface TicketExtraction extends BaseExtraction {
  documentType: "ticket";
  items: ExtractedLineItem[];
  subtotal: number;
  vatIncluded: boolean;
  total: number;
  paymentMethod: string | null;
  changeGiven: number | null;
}
```

### Cash Closing-Specific Fields

```typescript
interface CierreExtraction extends BaseExtraction {
  documentType: "cierre";
  openingCash: number;
  closingCash: number;
  totalSales: number;
  cardPayments: number;
  cashPayments: number;
  difference: number;          // Expected vs actual
  transactionCount: number | null;
}
```

### Full Extraction Union Type

```typescript
type DocumentExtraction =
  | InvoiceExtraction
  | AlbaranExtraction
  | TicketExtraction
  | CierreExtraction;
```

---

## Confidence Levels

### Definition

| Level    | Range     | Color  | Icon    | Meaning                                |
| -------- | --------- | ------ | ------- | -------------------------------------- |
| `alta`   | > 90%     | Green  | Check   | High confidence, likely correct        |
| `media`  | 70-90%    | Amber  | Warning | Medium confidence, verify recommended  |
| `baja`   | < 70%     | Red    | Alert   | Low confidence, manual review required |

```typescript
type ConfidenceLevel = "alta" | "media" | "baja";

interface ConfidenceScore {
  level: ConfidenceLevel;
  percentage: number; // 0-100
}
```

### Confidence Assignment

Claude returns a confidence score for each extracted field.
The Cloud Function maps percentages to levels:

```typescript
function toConfidenceLevel(percentage: number): ConfidenceLevel {
  if (percentage >= 90) return "alta";
  if (percentage >= 70) return "media";
  return "baja";
}
```

### UI Treatment by Confidence

| Level   | Background      | Border         | User Action        |
| ------- | --------------- | -------------- | ------------------ |
| `alta`  | `bg-green-50`   | `border-green` | No action needed   |
| `media` | `bg-amber-50`   | `border-amber` | Recommend verify   |
| `baja`  | `bg-red-50`     | `border-red`   | Must verify        |

---

## Human Review

### Review is ALWAYS Required

No extracted data is saved to Firestore without human confirmation.
This is non-negotiable for financial data.

### Review UI Requirements

```
+-------------------------------------------------------+
| Document Review                            [Discard]   |
+-------------------------------------------------------+
| [Document Image]          | Extracted Data             |
|                           |                            |
| (zoomable, pannable)      | Supplier: [Mercadona]  OK  |
|                           | Date: [2026-03-15]     OK  |
|                           | Doc #: [FAC-2026-0142] OK  |
|                           |                            |
|                           | Items:                     |
|                           | [Lomo iberico] [3] [kg]    |
|                           |  [12.50] [37.50]       OK  |
|                           |                            |
|                           | [Aceite oliva] [5] [l]     |
|                           |  [4.80] [24.00]    VERIFY  |
|                           |                            |
|                           | Subtotal: [61.50]          |
|                           | IVA 10%:  [6.15]           |
|                           | Total:    [67.65]      OK  |
|                           |                            |
|                           | [Confirm & Save]           |
+-------------------------------------------------------+
```

### Review UI Rules

| Rule                                          | Rationale                        |
| --------------------------------------------- | -------------------------------- |
| Side-by-side: image + extracted data          | Easy visual comparison           |
| Low-confidence fields highlighted             | Draw attention to problems       |
| Every field is editable                       | User can correct any extraction  |
| Original image always visible                 | Reference during review          |
| "Add Item" button for missed items            | Claude may miss items            |
| "Remove Item" button for phantom items        | Claude may hallucinate items     |
| Totals auto-recalculate on edit               | Math consistency                 |
| Confirm button requires all fields reviewed   | Prevent accidental saves         |

### Review Workflow

```
1. User sees extracted data with confidence colors
2. Low-confidence fields are auto-expanded for editing
3. User corrects any wrong values
4. User can add/remove line items
5. Totals recalculate automatically
6. User clicks "Confirm & Save"
7. Data saved to Firestore with source="ocr" metadata
8. Original image reference stored (for audit trail)
```

---

## Validation and Cross-Reference

### Supplier Matching

```typescript
// Cross-reference extracted supplier against proveedores collection
async function matchSupplier(
  extractedName: string,
  restaurantId: string
): Promise<SupplierMatch | null> {
  const suppliers = await getSuppliers(restaurantId);

  // Fuzzy match by name
  const match = findBestMatch(extractedName, suppliers.map((s) => s.name));

  if (match.score >= 0.8) {
    return { supplier: match.item, confidence: "alta" };
  }
  if (match.score >= 0.6) {
    return { supplier: match.item, confidence: "media" };
  }
  return null; // No match, user must select or create
}
```

### Product Matching

```typescript
// Cross-reference extracted product names against productos collection
async function matchProduct(
  extractedDescription: string,
  restaurantId: string
): Promise<ProductMatch | null> {
  const products = await getProducts(restaurantId);

  const match = findBestMatch(
    extractedDescription,
    products.map((p) => p.name)
  );

  if (match.score >= 0.7) {
    return { product: match.item, confidence: "alta" };
  }
  return null; // Suggest creating new product
}
```

### Validation Rules

| Validation                              | Action if Failed                       |
| --------------------------------------- | -------------------------------------- |
| Line item total != qty * price          | Highlight, flag for review             |
| Sum of items != subtotal                | Highlight, flag for review             |
| VAT calculation doesn't match           | Highlight, flag for review             |
| Supplier not found in database          | Prompt: select existing or create new  |
| Product not found in database           | Prompt: select existing or create new  |
| Date in the future                      | Warn user, likely extraction error     |
| Negative quantities                     | Flag as likely error                   |

---

## Error Handling

### Error Types and Recovery

| Error                            | Handling                              | User Sees                    |
| -------------------------------- | ------------------------------------- | ---------------------------- |
| Image too blurry/dark            | Return error with suggestion          | "Retake photo with better lighting" |
| Unreadable document              | Fall back to manual entry             | "Could not read document. Enter manually?" |
| API timeout                      | Retry with exponential backoff        | "Processing... please wait"  |
| API rate limit                   | Queue and retry                       | "Processing queued"          |
| Unsupported document type        | Inform user                           | "Document type not supported"|
| Partial extraction               | Return what was extracted + warnings  | Partial data with warnings   |
| Cloud Function crash             | Error logging + user notification     | "Processing failed. Try again" |

### Retry Strategy

```typescript
async function callClaudeVision(
  imageBase64: string,
  attempt: number = 1
): Promise<DocumentExtraction> {
  const MAX_RETRIES = 3;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
            { type: "text", text: EXTRACTION_PROMPT },
          ],
        },
      ],
    });

    return parseExtractionResponse(response);
  } catch (error) {
    if (attempt < MAX_RETRIES && isRetryable(error)) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await sleep(delay);
      return callClaudeVision(imageBase64, attempt + 1);
    }
    throw error;
  }
}

function isRetryable(error: unknown): boolean {
  if (error instanceof APIError) {
    return error.status === 429 || error.status >= 500;
  }
  return false;
}
```

### Manual Entry Fallback

When extraction fails completely, the user MUST be able to enter data manually.
The manual entry form mirrors the extraction review UI but starts empty.

---

## Cloud Function Implementation

### Function Structure

```typescript
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Anthropic from "@anthropic-ai/sdk";

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

export const processDocument = onCall(
  {
    secrets: [anthropicApiKey],
    region: "europe-west1",
    timeoutSeconds: 120,
    memory: "512MiB",
  },
  async (request) => {
    // 1. Validate auth
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be logged in");
    }

    // 2. Validate input
    const { imageBase64, documentType, restaurantId } = request.data;
    if (!imageBase64 || !restaurantId) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    // 3. Validate image size (max 5MB base64)
    if (imageBase64.length > 5 * 1024 * 1024 * 1.37) {
      throw new HttpsError("invalid-argument", "Image too large (max 5MB)");
    }

    // 4. Call Claude Vision
    const anthropic = new Anthropic({ apiKey: anthropicApiKey.value() });
    const extraction = await callClaudeVision(anthropic, imageBase64, documentType);

    // 5. Cross-reference with existing data
    const enriched = await enrichExtraction(extraction, restaurantId);

    // 6. Return structured result
    return enriched;
  }
);
```

### Extraction Prompt

```typescript
const EXTRACTION_PROMPT = `You are a document data extractor for a Spanish hospitality business.

Extract ALL data from this document image and return a JSON object.

Document types: factura (invoice), albaran (delivery note), ticket (receipt), cierre (cash closing).

Rules:
- Dates in ISO 8601 format (YYYY-MM-DD)
- Prices in EUR with 2 decimal places
- Spanish VAT rates: 4% (superreducido), 10% (reducido), 21% (general)
- Commas are decimal separators in Spanish (12,50 = 12.50)
- Dots are thousand separators in Spanish (1.250,00 = 1250.00)
- NIF format: 8 digits + letter (12345678A) or CIF: letter + 8 digits (B12345678)
- Units: kg, l, ud (unidades), caja, pack, docena, botella
- Include a confidence percentage (0-100) for each field

Return ONLY valid JSON matching this schema:
{
  "documentType": "factura|albaran|ticket|cierre",
  "confidence": 85,
  "supplier": { "name": "...", "nif": "...", "confidence": 90 },
  "date": { "value": "2026-03-15", "original": "15/03/2026", "confidence": 95 },
  "documentNumber": { "value": "...", "confidence": 80 },
  "items": [
    {
      "description": "...",
      "quantity": 3,
      "unit": "kg",
      "unitPrice": 12.50,
      "totalPrice": 37.50,
      "vatRate": 10,
      "discount": null,
      "confidence": 85
    }
  ],
  "subtotal": 61.50,
  "vatBreakdown": [{ "rate": 10, "base": 61.50, "amount": 6.15, "confidence": 90 }],
  "totalWithVAT": 67.65
}`;
```

---

## UI: Mobile Capture

### Primary Use Case

A waiter photographs a delivery note in the kitchen using their phone.
The UI must be optimized for this scenario.

### Camera Capture

```tsx
// Mobile camera input (primary)
<input
  type="file"
  accept="image/*"
  capture="environment"  // Back camera (for documents)
  onChange={handleFileSelect}
  className="hidden"
  id="document-capture"
/>
<label
  htmlFor="document-capture"
  className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-lg min-h-[44px] cursor-pointer"
>
  <CameraIcon className="w-6 h-6" />
  Take Photo
</label>

// File upload (desktop fallback)
<input
  type="file"
  accept="image/*,.pdf"
  onChange={handleFileSelect}
  className="hidden"
  id="document-upload"
/>
<label htmlFor="document-upload" className="...">
  <UploadIcon className="w-6 h-6" />
  Upload File
</label>
```

### Capture Tips UI

```tsx
// Show tips before capture
<div className="bg-blue-50 p-4 rounded-lg">
  <h3 className="font-semibold">Tips for best results:</h3>
  <ul className="mt-2 space-y-1 text-sm">
    <li>Place document on a flat, dark surface</li>
    <li>Ensure good lighting (no shadows)</li>
    <li>Capture the entire document in frame</li>
    <li>Hold phone steady, avoid blur</li>
    <li>Avoid glare from overhead lights</li>
  </ul>
</div>
```

### Processing States

```
[Idle]           -> "Take Photo" / "Upload File" buttons
[Uploading]      -> Progress bar + "Uploading..."
[Processing]     -> Spinner + "Analyzing document..." (may take 10-30s)
[Review]         -> Side-by-side review UI
[Saving]         -> Button spinner + "Saving..."
[Success]        -> Toast + redirect to document list
[Error]          -> Error message + retry/manual entry options
```

---

## Cost Management

### Claude API Costs

| Model          | Input (1M tokens) | Output (1M tokens) | Approx per document |
| -------------- | ------------------ | ------------------- | ------------------- |
| Claude Sonnet  | $3.00              | $15.00              | ~$0.01-0.05         |

### Cost Optimization Strategies

| Strategy                              | Implementation                         |
| ------------------------------------- | -------------------------------------- |
| Compress images before sending        | Reduce to < 1MB, JPEG quality 85%     |
| Use appropriate model                 | Sonnet for standard docs, not Opus    |
| Batch processing                      | Process multiple pages in one call     |
| Cache supplier/product matches        | Don't re-match known entities          |
| Limit retries                         | Max 3 retries to prevent runaway costs |

### Cost Tracking

```typescript
// Log every API call for cost tracking
interface APICallLog {
  timestamp: Timestamp;
  restaurantId: string;
  documentType: DocumentType;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  success: boolean;
}
```

---

## Privacy and Security

### Data Handling Rules

| Rule                                            | Implementation                       |
| ----------------------------------------------- | ------------------------------------ |
| Documents processed server-side only            | Cloud Function, never client-side    |
| API key stored as Firebase Secret               | `defineSecret("ANTHROPIC_API_KEY")`  |
| Raw images deleted after processing             | Cloud Storage lifecycle rule         |
| No raw images stored long-term                  | Delete after human review confirms   |
| Financial data in Firestore                     | Protected by security rules          |
| Extraction logs do not contain document content | Only metadata (type, date, status)   |
| User must be authenticated                      | `request.auth` check in CF           |
| User must belong to restaurant                  | Restaurant membership check in CF    |

### Image Retention Policy

```
Photo taken -> Upload to Cloud Storage (temp/)
            -> Process with Claude Vision
            -> Store thumbnail reference (for review UI)
            -> After user confirms: delete original image
            -> Keep: extraction JSON + metadata (not the image)
```

### Firestore Security Rules

```
// Only restaurant members can create/read extractions
match /extractions/{extractionId} {
  allow read: if isRestaurantMember(resource.data.restaurantId);
  allow create: if isRestaurantMember(request.resource.data.restaurantId);
  allow update: if isRestaurantMember(resource.data.restaurantId);
  allow delete: if false; // Financial records are immutable
}
```

---

## Testing

### Test Strategy

| Test Type              | What                                  | How                           |
| ---------------------- | ------------------------------------- | ----------------------------- |
| Unit tests             | JSON parsing, validation, matching    | Jest/Vitest                   |
| Integration tests      | Cloud Function end-to-end             | Firebase Emulator             |
| Sample documents       | Known invoices with expected output   | Golden file comparison        |
| Edge cases             | Blurry, rotated, partial documents    | Manual testing                |

### Test Documents

Maintain a set of sample documents in `test/fixtures/documents/`:

```
test/fixtures/documents/
  factura_simple.jpg          -> Expected: factura_simple.json
  factura_multiple_vat.jpg    -> Expected: factura_multiple_vat.json
  albaran_no_prices.jpg       -> Expected: albaran_no_prices.json
  albaran_handwritten.jpg     -> Expected: albaran_handwritten.json
  ticket_thermal.jpg          -> Expected: ticket_thermal.json
  cierre_standard.jpg         -> Expected: cierre_standard.json
```

### Accuracy Metrics

| Metric                          | Target       |
| ------------------------------- | ------------ |
| Document type detection         | > 95%        |
| Supplier name extraction        | > 90%        |
| Date extraction                 | > 95%        |
| Line item extraction            | > 85%        |
| Total amount extraction         | > 95%        |
| VAT calculation accuracy        | > 90%        |

---

## Future Enhancements

| Enhancement                          | Priority  | Description                              |
| ------------------------------------ | --------- | ---------------------------------------- |
| Multi-page PDF support               | High      | Process invoices with multiple pages     |
| Recurring document templates         | Medium    | Learn patterns from same supplier        |
| Automatic supplier creation          | Medium    | Create new supplier from extracted data  |
| Automatic product matching           | Medium    | Match line items to existing products    |
| Batch upload                         | Low       | Upload multiple documents at once        |
| Email attachment processing          | Low       | Auto-process invoices from email         |
| Price history tracking               | Low       | Track price changes per supplier/product |

---

## Version History

| Date       | Change                          | Author |
| ---------- | ------------------------------- | ------ |
| 2026-03-27 | Initial contract                | Aitor  |
