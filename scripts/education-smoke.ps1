$ErrorActionPreference = 'Stop'

$admin = (Get-Content .env.local | Where-Object { $_ -match '^ADMIN_PASSWORD=' } | Select-Object -First 1).Split('=')[1]
$hotelCode = 'RIXOS06'
$base = 'http://localhost:3000'

$types = @(
  'class_attendance',
  'lesson_material',
  'homework_quiz',
  'announcement_event',
  'education_support_ticket',
  'parent_teacher_meeting'
)

$created = @()
foreach ($moduleType in $types) {
  $body = @{
    action = 'createEducationModuleQr'
    password = $admin
    hotelCode = $hotelCode
    moduleType = $moduleType
    title = $moduleType
  } | ConvertTo-Json

  $resp = Invoke-RestMethod -Uri "$base/api/hotel/admin" -Method Post -ContentType 'application/json' -Body $body
  $created += [PSCustomObject]@{
    moduleType = $moduleType
    slug = $resp.module.slug
  }
}

$listBody = @{ action = 'list'; password = $admin } | ConvertTo-Json
$list = Invoke-RestMethod -Uri "$base/api/hotel/admin" -Method Post -ContentType 'application/json' -Body $listBody

$modsByType = @{}
foreach ($m in $list.modules) {
  if ($m.hotel_code -eq $hotelCode -and $types -contains $m.module_type -and -not $modsByType.ContainsKey($m.module_type)) {
    $modsByType[$m.module_type] = $m.slug
  }
}

$payloads = @(
  @{
    kind = 'class_attendance'
    payload = @{
      hotelCode = $hotelCode
      slug = $modsByType['class_attendance']
      lang = 'tr'
      studentNo = '1001'
      studentName = 'Ali'
      scanTime = '09:07'
      notifyParent = 'false'
    }
  },
  @{
    kind = 'lesson_material'
    payload = @{
      hotelCode = $hotelCode
      slug = $modsByType['lesson_material']
      lang = 'tr'
      studentNo = '1001'
      studentName = 'Ali'
      materialKey = 'lesson-notes-1'
    }
  },
  @{
    kind = 'homework_quiz'
    payload = @{
      hotelCode = $hotelCode
      slug = $modsByType['homework_quiz']
      lang = 'tr'
      studentNo = '1001'
      studentName = 'Ali'
      answers = '{"q1":"b"}'
    }
  },
  @{
    kind = 'announcement_event'
    payload = @{
      hotelCode = $hotelCode
      slug = $modsByType['announcement_event']
      lang = 'tr'
      studentNo = '1001'
      studentName = 'Ali'
      parentName = 'Ayse'
      parentPhone = '905551112233'
      eventResponse = 'accepted'
      notes = 'ok'
    }
  },
  @{
    kind = 'education_support_ticket'
    payload = @{
      hotelCode = $hotelCode
      slug = $modsByType['education_support_ticket']
      lang = 'tr'
      guestName = 'Teacher'
      requesterRole = 'teacher'
      categoryKey = 'smart-board'
      priority = 'normal'
      details = 'board issue'
      contactPhone = '905554445566'
    }
  },
  @{
    kind = 'parent_teacher_meeting'
    payload = @{
      hotelCode = $hotelCode
      slug = $modsByType['parent_teacher_meeting']
      lang = 'tr'
      studentNo = '1001'
      studentName = 'Ali'
      parentName = 'Ayse'
      parentPhone = '905551112233'
      teacherKey = 'math-teacher'
      requestedTime = '2026-05-20 14:30'
      notes = 'meeting'
    }
  }
)

$submitResults = @()
foreach ($entry in $payloads) {
  try {
    $response = Invoke-RestMethod -Uri "$base/api/hotel/module/submit" -Method Post -ContentType 'application/json' -Body ($entry.payload | ConvertTo-Json -Depth 8)
    $submitResults += [PSCustomObject]@{
      kind = $entry.kind
      ok = $true
      response = $response
    }
  }
  catch {
    $submitResults += [PSCustomObject]@{
      kind = $entry.kind
      ok = $false
      response = $_.ErrorDetails.Message
    }
  }
}

$reportBody = @{ action = 'listEducationReports'; password = $admin; hotelCode = $hotelCode } | ConvertTo-Json
$reports = Invoke-RestMethod -Uri "$base/api/hotel/admin" -Method Post -ContentType 'application/json' -Body $reportBody

[PSCustomObject]@{
  createdCount = $created.Count
  created = $created
  submitResults = $submitResults
  reportSummary = [PSCustomObject]@{
    quizByStudentCount = @($reports.quizByStudent).Count
    attendanceByStudentCount = @($reports.attendanceByStudent).Count
    supportTicketsCount = @($reports.supportTickets).Count
    meetingsCount = @($reports.meetings).Count
  }
} | ConvertTo-Json -Depth 10
