import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app.setup'

/* Boots the real module and the real HTTP pipeline against the .env database. */
describe('GET /health', () => {
  let app: INestApplication

  beforeAll(async () => {
    process.loadEnvFile?.('.env')
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = configureApp(moduleRef.createNestApplication({ logger: false }))
    await app.init()
  })

  afterAll(async () => {
    await app?.close()
  })

  it('answers 200 with the database up, outside the /api prefix', async () => {
    const res = await request(app.getHttpServer()).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'ok', db: 'ok' })
    expect(res.headers['x-request-id']).toBeDefined()
  })
})
