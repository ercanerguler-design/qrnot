import fs from 'fs'

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

  const fileBuffer = fs.readFileSync('test-claim.wav')
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
