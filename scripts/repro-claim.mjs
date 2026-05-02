import fs from 'fs'

function createSampleWavBuffer() {
  const sampleRate = 8000
  const seconds = 1
  const numSamples = sampleRate * seconds
  const dataSize = numSamples * 2
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let index = 0; index < numSamples; index += 1) {
    const time = index / sampleRate
    const sample = Math.round(Math.sin(2 * Math.PI * 440 * time) * 12000)
    buffer.writeInt16LE(sample, 44 + index * 2)
  }

  return buffer
}

async function main() {
  const createRes = await fetch('https://qrnote-sage.vercel.app/api/qr/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'Ka250806Ka..', count: 1 }),
  })

  const createText = await createRes.text()
  console.log('CREATE_STATUS', createRes.status)
  console.log('CREATE_BODY', createText)

  const createData = JSON.parse(createText)
  const slug = createData.created?.[0]?.slug
  if (!slug) {
    process.exit(1)
  }

  const filePath = 'test-claim.wav'
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, createSampleWavBuffer())
  }

  const fileBuffer = fs.readFileSync(filePath)
  const file = new File([fileBuffer], 'test-claim.wav', { type: 'audio/wav' })
  const formData = new FormData()
  formData.append('audio', file)
  formData.append('title', 'Test Claim')

  const claimRes = await fetch(`https://qrnote-sage.vercel.app/api/qr/${slug}/claim`, {
    method: 'POST',
    body: formData,
  })

  const claimText = await claimRes.text()
  console.log('CLAIM_STATUS', claimRes.status)
  console.log('CLAIM_BODY', claimText)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
