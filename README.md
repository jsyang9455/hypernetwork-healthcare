# 하이퍼네트워크 헬스케어 (Hypernetwork Healthcare)

실시간 건강 및 침대 움직임 모니터링 시스템 - Korean nursing home healthcare monitoring dashboard.

## 주요 기능 (Features)
- 실시간 건강 모니터링 (Real-time health monitoring)
- 침대 움직임 추적 (Bed movement tracking)
- 외부 센서 연동 (External sensor integration - `https://SensorDeviceSvr.replit.app`)
- 재활치료 관리 (Rehabilitation management)
- PDF 리포트 생성 (PDF report generation)
- 한국어/영어 다국어 지원 (Korean/English bilingual support)

## 기술 스택 (Tech Stack)
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Wouter, Vite
- **Backend**: Node.js, Express.js, WebSocket (ws)
- **Database**: PostgreSQL, Drizzle ORM (기본은 메모리 저장소(MemStorage)로 동작하므로 DB 없이도 실행 가능)

---

## 로컬 실행 (Local Development)

```bash
npm install
npm run dev
```

- 개발 서버가 `http://localhost:5000` 에서 실행됩니다 (프론트엔드 + 백엔드 동일 포트).
- 로그인 정보: 관리자 `test / test123`, 회원 `kimmy / password123`

---

## AWS 서버 배포 가이드 (Deploy on AWS EC2)

아래는 AWS EC2(Ubuntu) 인스턴스에서 GitHub 소스를 받아 실행하는 전체 과정입니다.

### 1. EC2 인스턴스 준비
1. AWS 콘솔에서 **EC2 인스턴스 생성** (Ubuntu 22.04 LTS 권장, t2.small 이상).
2. **보안 그룹(Security Group)** 인바운드 규칙 추가:
   - SSH: TCP `22` (내 IP)
   - HTTP: TCP `80` (0.0.0.0/0)
   - HTTPS: TCP `443` (0.0.0.0/0) — SSL 사용 시
   - (Nginx 없이 직접 노출할 경우) 앱 포트: TCP `5000` (0.0.0.0/0)
3. 키 페어(.pem)로 SSH 접속:
   ```bash
   ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
   ```

### 2. Node.js 설치 (v20 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v   # v20.x 확인
```

### 3. 소스 내려받기 (Clone)
```bash
cd ~
git clone https://github.com/jsyang9455/hypernetwork-healthcare.git
cd hypernetwork-healthcare
```

### 4. 의존성 설치 및 빌드
```bash
npm install
npm run build
```
- `npm run build` 는 프론트엔드를 `dist/public` 에, 서버를 `dist/index.js` 로 번들링합니다.

### 5. 환경 변수 설정 (선택)
프로젝트는 기본적으로 메모리 저장소로 동작하여 DB 없이도 실행됩니다. 필요 시 환경 변수를 설정하세요.

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `PORT` | 서버가 사용할 포트 | `5000` |
| `NODE_ENV` | 실행 모드 | `production` (start 스크립트가 자동 설정) |
| `DATABASE_URL` | PostgreSQL 연결 문자열 (DB 스키마 사용 시) | (없음) |

예시:
```bash
export PORT=5000
```

### 6. 실행 (Run)

#### 방법 A — 바로 실행 (테스트용)
```bash
npm start
```

#### 방법 B — PM2로 상시 실행 (권장)
서버가 종료되거나 재부팅돼도 자동으로 다시 실행되도록 PM2를 사용합니다.
```bash
sudo npm install -g pm2

# 빌드된 서버 실행
PORT=5000 pm2 start dist/index.js --name healthcare --env production

# 부팅 시 자동 시작 등록
pm2 startup
pm2 save

# 상태 / 로그 확인
pm2 status
pm2 logs healthcare
```

이제 `http://<EC2_PUBLIC_IP>:5000` 으로 접속하면 됩니다.

### 7. Nginx 리버스 프록시 (80포트 → 5000, 권장)
80포트로 깔끔하게 접속하려면 Nginx를 앞단에 둡니다.
```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/healthcare
```
아래 내용을 입력:
```nginx
server {
    listen 80;
    server_name <도메인 또는 EC2_PUBLIC_IP>;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;          # WebSocket 지원
        proxy_set_header Connection "upgrade";           # WebSocket 지원
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
활성화 및 재시작:
```bash
sudo ln -s /etc/nginx/sites-available/healthcare /etc/nginx/sites-enabled/
sudo nginx -t          # 설정 문법 확인
sudo systemctl restart nginx
```
> ⚠️ 실시간 데이터는 WebSocket(`/ws`)을 사용하므로 위 `Upgrade` / `Connection` 헤더 설정이 반드시 필요합니다.

이제 `http://<도메인 또는 EC2_PUBLIC_IP>` (80포트)로 접속할 수 있습니다.

### 8. HTTPS 적용 (선택, 도메인 필요)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 코드 업데이트 후 재배포 (Redeploy)
GitHub에 새 코드가 올라왔을 때:
```bash
cd ~/hypernetwork-healthcare
git pull
npm install
npm run build
pm2 restart healthcare
```

---

## 자주 발생하는 문제 (Troubleshooting)
- **접속이 안 될 때**: AWS 보안 그룹에서 해당 포트(80 또는 5000)가 열려 있는지 확인하세요.
- **실시간 데이터가 안 보일 때**: Nginx 설정에 WebSocket(`Upgrade`/`Connection`) 헤더가 있는지 확인하세요.
- **포트 충돌**: `PORT` 환경 변수로 다른 포트를 지정하세요. (예: `PORT=8080 pm2 start dist/index.js --name healthcare`)
- **센서 데이터가 없을 때**: 외부 센서 서버(`https://SensorDeviceSvr.replit.app`)가 응답하는지 확인하세요. 서버는 30초마다 자동으로 데이터를 가져옵니다.

## 프로젝트 구조 (Project Structure)
```
client/    React 프론트엔드 (페이지, 컴포넌트, UI)
server/    Express 백엔드 (라우트, 저장소, WebSocket, 센서 폴링)
shared/    프론트/백엔드 공용 스키마 (Drizzle + Zod)
```
