[CmdletBinding()]
param(
    [string]$CommitMessage = ""
)

$ErrorActionPreference = "Stop"

# Cau hinh repository wedding-invitation2
$ProjectPath = "D:\ACuoiPhong\wedding-invitation2"
$GitHubRepo  = "JPWarrency/wedding-invitation2"
$Branch      = "main"
$SiteUrl     = "https://jpwarrency.github.io/wedding-invitation2/"

function Stop-WithMessage([string]$Message) {
    Write-Host ""
    Write-Host $Message -ForegroundColor Red
    exit 1
}

Write-Host "=== CAP NHAT WEBSITE THIEP CUOI ===" -ForegroundColor Cyan

# 1. Kiem tra thu muc va cong cu
if (-not (Test-Path -LiteralPath $ProjectPath -PathType Container)) {
    Stop-WithMessage "Khong tim thay thu muc du an: $ProjectPath"
}

Set-Location -LiteralPath $ProjectPath

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Stop-WithMessage "May chua cai Git hoac Git chua co trong PATH."
}

# 2. Kiem tra nhanh repository
$insideRepo = git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0 -or $insideRepo -ne "true") {
    Stop-WithMessage "Thu muc nay khong phai Git repository."
}

$branchNow = (git branch --show-current).Trim()
if ($branchNow -ne $Branch) {
    Stop-WithMessage "Ban dang o nhanh '$branchNow', khong phai '$Branch'. Script dung de tranh push nham nhanh."
}

$remoteUrl = (git remote get-url origin).Trim()
if ($LASTEXITCODE -ne 0 -or $remoteUrl -notmatch 'JPWarrency/wedding-invitation2(\.git)?$') {
    Stop-WithMessage "Remote origin khong dung repository mong doi. Hien tai: $remoteUrl"
}

# 3. Dua thay doi vao staging
Write-Host "`n[1/5] Dang kiem tra va them thay doi..." -ForegroundColor Yellow
git add -A
if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "git add that bai."
}

$staged = git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "Khong co thay doi moi de commit." -ForegroundColor Green
    $currentCommit = (git rev-parse --short HEAD).Trim()
    $siteLink = "${SiteUrl}?v=$currentCommit"
    Write-Host "`nLink theo commit hien tai: $siteLink" -ForegroundColor Cyan
    Write-Host "Neu ban vua thay doi file, hay kiem tra file da duoc luu chua."
    exit 0
}
elseif ($LASTEXITCODE -ne 1) {
    Stop-WithMessage "Khong the kiem tra cac thay doi da staging."
}

# 4. Commit
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = Read-Host "`nNhap noi dung commit (Enter de dung 'Update wedding website')"
}
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = "Update wedding website"
}

Write-Host "`n[2/5] Dang commit..." -ForegroundColor Yellow
git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "Commit that bai. Hay doc thong bao loi o tren."
}

# 5. Push
Write-Host "`n[3/5] Dang push len GitHub..." -ForegroundColor Yellow
git push origin $Branch
if ($LASTEXITCODE -ne 0) {
    Stop-WithMessage "Push that bai. Kiem tra ket noi, quyen truy cap GitHub va thu chay lai script."
}

$fullCommit  = (git rev-parse HEAD).Trim()
$shortCommit = (git rev-parse --short HEAD).Trim()

Write-Host "`nPush thanh cong. Commit: $shortCommit" -ForegroundColor Green

# 6. Cho GitHub Pages build dung commit vua push (neu GitHub CLI co san)
$gh = Get-Command gh -ErrorAction SilentlyContinue
$pagesConfirmed = $false

if ($gh) {
    Write-Host "`n[4/5] Dang cho GitHub Pages build commit moi..." -ForegroundColor Yellow
    try {
        gh auth status 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            throw "GitHub CLI chua dang nhap. Chay 'gh auth login' de dang nhap."
        }

        for ($attempt = 1; $attempt -le 30; $attempt++) {
            $buildJson = gh api "repos/$GitHubRepo/pages/builds/latest" 2>$null
            if ($LASTEXITCODE -eq 0 -and $buildJson) {
                $build = $buildJson | ConvertFrom-Json
                $buildCommit = [string]$build.commit
                $buildStatus = [string]$build.status

                if ($buildCommit -eq $fullCommit -and $buildStatus -eq "built") {
                    $pagesConfirmed = $true
                    break
                }

                if ($buildCommit -eq $fullCommit -and $buildStatus -eq "errored") {
                    Write-Host "GitHub Pages bao build that bai cho commit nay." -ForegroundColor Red
                    if ($build.error.message) {
                        Write-Host $build.error.message -ForegroundColor Red
                    }
                    break
                }
            }

            Write-Host "Lan $attempt/30 - Pages chua build xong commit $shortCommit. Doi 10 giay..." -ForegroundColor DarkGray
            Start-Sleep -Seconds 10
        }
    }
    catch {
        Write-Host "Khong the xac nhan Pages build qua GitHub CLI: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}
else {
    Write-Host "`n[4/5] Khong tim thay GitHub CLI (gh). Bo qua buoc doi xac nhan build." -ForegroundColor Yellow
    Write-Host "Co the cai GitHub CLI va dang nhap bang lenh: gh auth login"
}

# 7. Tao link cache-busting va kiem tra HTTP
$siteLink = "${SiteUrl}?v=$shortCommit"
Write-Host "`n[5/5] Dang kiem tra trang web..." -ForegroundColor Yellow

if ($pagesConfirmed) {
    Write-Host "GitHub Pages da xac nhan build thanh cong dung commit $shortCommit." -ForegroundColor Green
}
else {
    Write-Host "Chua xac nhan duoc Pages build dung commit moi. Link van duoc tao, nhung co the can doi them." -ForegroundColor Yellow
}

try {
    $response = Invoke-WebRequest -Uri $siteLink -UseBasicParsing -TimeoutSec 20
    Write-Host "HTTP status: $([int]$response.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "Chua truy cap duoc link hoac website dang cap nhat: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "COMMIT : $shortCommit"
Write-Host "WEBSITE: $siteLink" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Hay mo link tren bang cua so an danh hoac nhan Ctrl+Shift+R de tai lai khong dung cache."
