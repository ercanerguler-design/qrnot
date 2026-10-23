import { SITE_URL } from '@/lib/site'
import { BATTERY_ITEM_FIELDS, SECTOR_FIELDS, type SectorField } from './sectors'
import { DPP_CATEGORIES, DPP_LANGS } from './types'

// QRNot DPP API v1 için OpenAPI 3.1 tanımı. Sektör alanları sectors.ts'ten üretilir: belge ile sistem ayrışmaz.

function fieldSchema(f: SectorField) {
  const base: Record<string, unknown> = {}
  if (f.ref) base.description = `${f.ref}${f.unit ? ` · ${f.unit}` : ''}${f.required ? ' · required to publish' : ''}`
  switch (f.type) {
    case 'number':
      return { ...base, type: 'number', ...(f.min !== undefined ? { minimum: f.min } : {}), ...(f.max !== undefined ? { maximum: f.max } : {}) }
    case 'select':
      return { ...base, type: 'string', enum: f.options }
    case 'multi':
      return { ...base, type: 'array', items: { type: 'string', enum: f.options } }
    case 'country':
      return { ...base, type: 'string', pattern: '^[A-Z]{2}$' }
    case 'url':
      return { ...base, type: 'string', format: 'uri' }
    default:
      return { ...base, type: 'string' }
  }
}

const objOf = (fields: readonly SectorField[]) => ({
  type: 'object',
  additionalProperties: false,
  properties: Object.fromEntries(fields.map((f) => [f.key, fieldSchema(f)])),
})

const party = { type: 'object', properties: { name: { type: 'string' }, address: { type: 'string' }, contact: { type: 'string' } } }
const err = (description: string) => ({ description, content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } })
const json = (ref: string) => ({ 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } })
const pid = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
const commonErrors = { '401': err('Invalid or revoked API key'), '403': err('No write permission, panel locked or demo expired'), '429': err('Rate limit (1200 requests / hour / key)') }

export function openApiSpec() {
  const texts = {
    type: 'object',
    properties: { name: { type: 'string' }, description: { type: 'string' }, care: { type: 'string' }, repair: { type: 'string' }, endOfLife: { type: 'string' }, safety: { type: 'string' }, materialNames: { type: 'array', items: { type: 'string' } } },
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'QRNot Digital Product Passport API',
      version: '1.0.0',
      description:
        'Create and update digital product passports from your ERP / PIM / BMS. Changes are saved as drafts; the public passport changes only after /publish. Every write is recorded in the company audit log.',
    },
    servers: [{ url: `${SITE_URL}/api/dpp/v1` }],
    security: [{ bearer: [] }],
    components: {
      securitySchemes: { bearer: { type: 'http', scheme: 'bearer', description: 'API key created in the panel (Settings → API keys), starts with qrn_live_' } },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } } },
              },
            },
          },
        },
        Texts: texts,
        BatterySector: objOf(SECTOR_FIELDS.battery),
        TextileSector: objOf(SECTOR_FIELDS.textile),
        FurnitureSector: objOf(SECTOR_FIELDS.furniture),
        BatteryStatus: objOf(BATTERY_ITEM_FIELDS),
        Data: {
          type: 'object',
          description: 'On PATCH, nested objects are merged key by key; arrays (materials, compliance) are replaced.',
          properties: {
            brand: { type: 'string' },
            model: { type: 'string' },
            gtin: { type: 'string', description: 'GTIN-8/12/13/14 with a valid check digit' },
            category: { type: 'string', enum: Object.keys(DPP_CATEGORIES) },
            countryOfOrigin: { type: 'string', pattern: '^[A-Z]{2}$' },
            manufacturer: party,
            euOperator: party,
            weightGrams: { type: ['number', 'null'] },
            dimensions: { type: 'string' },
            materials: {
              type: 'array',
              items: { type: 'object', properties: { name: { type: 'string' }, percent: { type: ['number', 'null'] }, recycledPercent: { type: ['number', 'null'] }, origin: { type: 'string' } } },
            },
            environment: {
              type: 'object',
              properties: {
                carbonKg: { type: ['number', 'null'] },
                waterLiters: { type: ['number', 'null'] },
                energyKwh: { type: ['number', 'null'] },
                recycledContentPercent: { type: ['number', 'null'] },
                recyclablePercent: { type: ['number', 'null'] },
                expectedLifetimeYears: { type: ['number', 'null'] },
              },
            },
            repairability: {
              type: 'object',
              properties: { warrantyMonths: { type: ['number', 'null'] }, sparePartsYears: { type: ['number', 'null'] }, repairScore: { type: ['number', 'null'] }, serviceUrl: { type: 'string' } },
            },
            compliance: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, reference: { type: 'string' } } } },
            substancesOfConcern: { type: 'string' },
            sector: {
              description: 'Sector module, chosen by category: battery → BatterySector, textile/footwear → TextileSector, furniture → FurnitureSector',
              oneOf: [{ $ref: '#/components/schemas/BatterySector' }, { $ref: '#/components/schemas/TextileSector' }, { $ref: '#/components/schemas/FurnitureSector' }],
            },
            restricted: { type: 'object', description: 'Visible only with the authority key', properties: { suppliers: { type: 'string' }, facility: { type: 'string' }, notes: { type: 'string' } } },
          },
        },
        ProductInput: {
          type: 'object',
          properties: {
            externalId: { type: 'string', maxLength: 100, description: 'Your ERP / PIM product code (unique within your company)' },
            defaultLang: { type: 'string', enum: DPP_LANGS },
            texts: { type: 'object', description: 'Per language, e.g. { "tr": {...}, "en": {...} }', additionalProperties: { $ref: '#/components/schemas/Texts' } },
            data: { $ref: '#/components/schemas/Data' },
            revision: { type: 'integer', description: 'Optional optimistic lock: 409 if the product changed since this revision' },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            publicId: { type: 'string' },
            externalId: { type: ['string', 'null'] },
            status: { type: 'string', enum: ['draft', 'published', 'archived'] },
            version: { type: 'integer', description: 'Last published version (0 = never published)' },
            revision: { type: 'integer' },
            hasUnpublishedChanges: { type: 'boolean' },
            defaultLang: { type: 'string' },
            texts: { type: 'object' },
            data: { $ref: '#/components/schemas/Data' },
            itemCount: { type: 'integer' },
            passportUrl: { type: 'string', format: 'uri' },
            digitalLink: { type: ['string', 'null'], format: 'uri' },
            updatedAt: { type: 'string' },
            publishedAt: { type: ['string', 'null'] },
          },
        },
        Item: {
          type: 'object',
          properties: {
            serial: { type: 'string' },
            publicId: { type: 'string' },
            batch: { type: ['string', 'null'] },
            productionDate: { type: ['string', 'null'], format: 'date' },
            passportUrl: { type: 'string', format: 'uri' },
            digitalLink: { type: ['string', 'null'], format: 'uri' },
            status: { oneOf: [{ $ref: '#/components/schemas/BatteryStatus' }, { type: 'null' }] },
            statusUpdatedAt: { type: ['string', 'null'] },
          },
        },
      },
    },
    paths: {
      '/me': { get: { summary: 'Company, plan limits and key permissions (connection test)', responses: { '200': { description: 'OK' }, ...commonErrors } } },
      '/products': {
        get: {
          summary: 'List products',
          parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'published', 'archived'] } }],
          responses: { '200': { description: 'OK' }, ...commonErrors },
        },
        post: {
          summary: 'Create a product draft (with externalId: create or update)',
          requestBody: { required: true, content: json('ProductInput') },
          responses: { '201': { description: 'Created' }, '200': { description: 'Updated (externalId already existed)' }, '400': err('Validation error'), '402': err('Plan product limit reached'), ...commonErrors },
        },
      },
      '/products/{id}': {
        get: { summary: 'Get a product (draft state)', parameters: [pid], responses: { '200': { description: 'OK', content: json('Product') }, '404': err('Not found'), ...commonErrors } },
        patch: {
          summary: 'Partially update a product draft',
          parameters: [pid],
          requestBody: { required: true, content: json('ProductInput') },
          responses: { '200': { description: 'OK', content: json('Product') }, '404': err('Not found'), '409': err('Changed since revision / externalId taken'), ...commonErrors },
        },
      },
      '/products/{id}/publish': {
        post: {
          summary: 'Publish the draft as a new passport version',
          parameters: [pid],
          responses: { '200': { description: 'Published', content: json('Product') }, '400': err('Required fields missing (see error.details)'), ...commonErrors },
        },
      },
      '/products/{id}/items': {
        get: {
          summary: 'List serial numbers (one passport each)',
          parameters: [pid, { name: 'q', in: 'query', schema: { type: 'string' } }, { name: 'limit', in: 'query', schema: { type: 'integer', maximum: 1000 } }, { name: 'offset', in: 'query', schema: { type: 'integer' } }],
          responses: { '200': { description: 'OK' }, ...commonErrors },
        },
        post: {
          summary: 'Add serial numbers: an explicit list or a generated range (max 2000 per call). Existing serials are skipped.',
          parameters: [pid],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      required: ['serials'],
                      properties: {
                        serials: { type: 'array', maxItems: 2000, items: { type: 'object', required: ['serial'], properties: { serial: { type: 'string' }, batch: { type: 'string' }, productionDate: { type: 'string', format: 'date' } } } },
                      },
                    },
                    { type: 'object', required: ['count'], properties: { count: { type: 'integer', minimum: 1, maximum: 2000 }, prefix: { type: 'string' }, start: { type: 'integer' }, batch: { type: 'string' }, productionDate: { type: 'string', format: 'date' } } },
                  ],
                },
              },
            },
          },
          responses: { '201': { description: '{ created, skipped }' }, '200': { description: 'Nothing new (all serials existed)' }, ...commonErrors },
        },
        put: {
          summary: 'Battery products: bulk update the status of many batteries by serial',
          parameters: [pid],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { rows: { type: 'array', maxItems: 5000, items: { allOf: [{ type: 'object', properties: { serial: { type: 'string' } } }, { $ref: '#/components/schemas/BatteryStatus' }] } } } } } },
          },
          responses: { '200': { description: '{ updated, errors[] }' }, ...commonErrors },
        },
      },
      '/products/{id}/items/{serial}': {
        patch: {
          summary: 'Battery products: update one battery’s status (state of health, cycles, …). Takes effect immediately, no publish needed.',
          parameters: [pid, { name: 'serial', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: json('BatteryStatus') },
          responses: { '200': { description: 'OK' }, '404': err('Serial not found'), ...commonErrors },
        },
      },
      '/products/external/{externalId}': {
        get: {
          summary: 'Get a product by your ERP code',
          parameters: [{ name: 'externalId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { '200': { description: 'OK', content: json('Product') }, '404': err('Not found'), ...commonErrors },
        },
        put: {
          summary: 'Create or update by your ERP code (safe to repeat)',
          parameters: [{ name: 'externalId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { required: true, content: json('ProductInput') },
          responses: { '201': { description: 'Created' }, '200': { description: 'Updated' }, ...commonErrors },
        },
      },
    },
  }
}
