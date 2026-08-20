$Body = @{
    full_name = "Test Student"
    email = "test@example.com"
    password = "TestPassword123"
    role = "student"
} | ConvertTo-Json

$Result = Invoke-WebRequest -Uri "http://localhost:8000/auth/register" -Method POST -Body $Body -ContentType "application/json" -UseBasicParsing
$Result.Content | ConvertFrom-Json | Format-List
