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

## ⚡ AWS 빠른 시작 (One-Command Quick Start)

**갓 만든 EC2(Ubuntu) 인스턴스에 SSH로 접속한 뒤, 아래 명령어 한 줄만 복사해서 붙여넣으면** 스왑 메모리 설정 → Node.js 설치 → 소스 내려받기 → 빌드 → 센서 연동 포함 실행까지 한 번에 됩니다.

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs git && git clone https://github.com/jsyang9455/hypernetwork-healthcare.git && cd hypernetwork-healthcare && npm install && npm run build && sudo npm install -g pm2 && PORT=5000 SENSOR_API_URL=https://SensorDeviceSvr.replit.app/api/readings SENSOR_POLL_INTERVAL=30000 pm2 start dist/index.js --name healthcare && pm2 startup && pm2 save
```

실행이 끝나면 `http://<EC2_PUBLIC_IP>:5000` 으로 접속할 수 있습니다.
- 로그인: 관리자 `test / test123`, 회원 `kimmy / password123`
- 센서는 자동으로 30초마다 동기화됩니다 (로그 확인: `pm2 logs healthcare`).
- 80포트(도메인)·HTTPS·문제 해결 등 자세한 내용은 아래 [AWS 서버 배포 가이드](#aws-서버-배포-가이드-deploy-on-aws-ec2)를 참고하세요.

> ⚠️ 접속 전에 AWS **보안 그룹**에서 `5000` 포트(또는 80 포트)를 열어야 합니다.
>
> 💡 **`Killed` 메시지가 뜬다면** 메모리 부족(OOM)입니다. 위 명령어는 맨 앞에 **2GB 스왑 메모리**를 자동으로 추가하므로 `t2.micro`(RAM 1GB) 같은 작은 인스턴스에서도 빌드가 됩니다. 이미 `Killed`가 났던 경우, 아래 [문제 해결](#자주-발생하는-문제-troubleshooting)의 스왑 설정 후 다시 시도하세요.

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
| `SENSOR_API_URL` | 외부 센서 서버의 측정값 엔드포인트 URL | `https://SensorDeviceSvr.replit.app/api/readings` |
| `SENSOR_POLL_INTERVAL` | 센서 데이터 폴링 주기 (밀리초, 1000 이상 정수) | `30000` (30초) |

예시:
```bash
export PORT=5000
export SENSOR_API_URL=https://SensorDeviceSvr.replit.app/api/readings
export SENSOR_POLL_INTERVAL=30000
```

> 💡 AWS에서 한 번에 설정하려면 `.env` 대신 PM2 실행 시 환경 변수를 함께 전달하면 됩니다 (아래 [센서 연동](#센서-연동-구조-sensor-integration) 섹션 참고).

### 6. 실행 (Run)

#### 방법 A — 바로 실행 (테스트용)
```bash
npm start
```

#### 방법 B — PM2로 상시 실행 (권장)
서버가 종료되거나 재부팅돼도 자동으로 다시 실행되도록 PM2를 사용합니다.
```bash
sudo npm install -g pm2

# 빌드된 서버 실행 (센서 연동 환경변수 포함)
PORT=5000 \
SENSOR_API_URL=https://SensorDeviceSvr.replit.app/api/readings \
SENSOR_POLL_INTERVAL=30000 \
pm2 start dist/index.js --name healthcare --env production

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

## 센서 연동 구조 (Sensor Integration)

이 시스템은 외부 센서 서버에서 실제 측정값을 받아 화면에 표시합니다. AWS 설치 시 **별도 작업 없이 자동으로** 동작하며, 환경 변수만 바꾸면 다른 센서 서버로도 연결할 수 있습니다.

### 전체 흐름 (Architecture)
```
┌────────────────────────┐      30초마다 폴링       ┌──────────────────────────┐      WebSocket(/ws)     ┌─────────────┐
│  센서 서버               │  ───────────────────▶  │  본 서버 (Express)         │  ───────────────────▶  │  브라우저     │
│  SensorDeviceSvr        │   GET /api/readings    │  - MAC → 환자 매핑          │   실시간 데이터 전송      │  대시보드     │
│  .replit.app            │                        │  - 건강/움직임 DB 저장      │                         │             │
└────────────────────────┘                        │  - 이상치 알림 생성         │                         └─────────────┘
                                                   └──────────────────────────┘
```

1. 서버가 시작되면 즉시 1회, 이후 **30초마다** 센서 서버(`SENSOR_API_URL`)의 `/api/readings` 를 호출합니다.
2. 각 측정값의 **MAC 주소**로 어떤 환자(사용자)인지 식별합니다.
3. 받은 값을 건강 데이터(심박수·호흡수)와 침대 움직임 데이터(자세·움직임 강도)로 변환해 저장합니다.
4. 이상치(예: 심박수 100 초과/50 미만)는 자동으로 알림을 생성합니다.
5. WebSocket(`/ws`)으로 모든 접속 화면에 실시간 전송합니다.

### 센서 데이터 필드 (Data Fields)
센서 서버가 주는 `/api/readings` 응답 항목과 매핑:

| 센서 필드 | 의미 | 시스템 매핑 |
|-----------|------|-------------|
| `mac` | 센서 장치 고유 주소 | 환자(사용자) 식별 |
| `hr` | 심박수 (bpm) | 건강 데이터 → 심박수 |
| `br` | 호흡수 | 건강 데이터 → 호흡수 |
| `pos` | 자세 코드 (0~5) | 침대 움직임 → 누움/앉음/서있음 |
| `en1`~`en7` | 에너지/환경 센서값 | 움직임 강도·이동성 점수 계산 |
| `err` | 오류 코드 | (모니터링용) |

### MAC ↔ 환자 매핑 (현재 설정)
| 센서 MAC | 장치 이름 | 환자 ID | 위치 |
|----------|-----------|---------|------|
| `8CBFEAAE4A64` | 침대센서-A | 1 (김미영) | 101호 |
| `E4B323065F54` | 침대센서-B | 2 (이준호) | 102호 |
| `8CBFEAA77777` | 침대센서-C | 3 (박서영) | 103호 |

> 매핑을 추가/변경하려면 `server/routes.ts` 상단의 `MAC_TO_USER_ID`, `MAC_TO_DEVICE_NAME` 객체를 수정한 뒤 다시 빌드(`npm run build`)하면 됩니다.

### AWS에서 한 번에 설정하기 (One-shot Setup)
센서 연동은 코드에 기본값이 들어 있어 **추가 설정 없이 바로 동작**합니다. 센서 서버 주소나 폴링 주기를 바꾸려면 PM2 실행 시 환경 변수만 전달하세요. 매번 길게 입력하지 않으려면 아래 **ecosystem 파일** 방식을 권장합니다.

`~/hypernetwork-healthcare/ecosystem.config.cjs` 파일을 만들고:
```js
module.exports = {
  apps: [
    {
      name: "healthcare",
      script: "dist/index.js",
      env: {
        NODE_ENV: "production",
        PORT: "5000",
        SENSOR_API_URL: "https://SensorDeviceSvr.replit.app/api/readings",
        SENSOR_POLL_INTERVAL: "30000",
      },
    },
  ],
};
```
실행:
```bash
pm2 start ecosystem.config.cjs
pm2 startup
pm2 save
```
이후 설정을 바꾸면 `pm2 restart ecosystem.config.cjs --update-env` 로 반영합니다.

### 연동 확인 (Verify)
```bash
# 1) 서버 로그에 30초마다 동기화 메시지가 보이는지 확인
pm2 logs healthcare
#   → [Sensor] Synced 3 devices at ...

# 2) 센서 상태 API 직접 호출 (connected: true 면 정상)
curl http://localhost:5000/api/sensor/status

# 3) 센서 원본 데이터 확인
curl http://localhost:5000/api/sensor/readings
```
대시보드 좌측 상단의 **"센서 연결됨 / 센서 오프라인"** 배지로도 연동 상태를 한눈에 확인할 수 있습니다.

### 관련 API 엔드포인트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/sensor/status` | 연결 상태, 마지막 동기화 시각, 장치 수, MAC 매핑 |
| GET | `/api/sensor/readings` | 센서 서버에서 받은 최신 원본 측정값 |

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
- **`Killed` 메시지가 뜨며 빌드/설치가 멈출 때 (메모리 부족, OOM)**: `t2.micro`(RAM 1GB) 등 작은 인스턴스에서 자주 발생합니다. 아래처럼 **스왑 메모리 2GB**를 추가한 뒤 다시 빌드하면 해결됩니다.
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  # 재부팅 후에도 유지되도록 등록
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  free -h   # Swap 항목에 2.0Gi 가 보이면 성공

  # 그 다음 다시 빌드/실행
  cd ~/hypernetwork-healthcare && npm install && npm run build
  PORT=5000 SENSOR_API_URL=https://SensorDeviceSvr.replit.app/api/readings SENSOR_POLL_INTERVAL=30000 pm2 start dist/index.js --name healthcare && pm2 save
  ```
  > 더 근본적으로는 `t2.small`(RAM 2GB) 이상 인스턴스를 사용하면 스왑 없이도 빌드됩니다.
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
