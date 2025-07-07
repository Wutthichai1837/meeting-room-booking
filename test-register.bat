@echo off
echo Testing Registration API...
echo.

curl -X POST http://localhost:3000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"testuser123\",\"email\":\"test@example.com\",\"password\":\"password123\",\"firstName\":\"Test\",\"lastName\":\"User\",\"phone\":\"0812345678\",\"department\":\"IT\"}" ^
  -v

echo.
echo Test completed. Check the response above.
pause
