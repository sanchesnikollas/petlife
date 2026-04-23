# PetLife — Guia de Publicação nas Lojas

## Pré-requisitos de ambiente

### iOS
1. **Xcode** atualizado (16+)
2. Instalar plataforma iOS: Xcode > Settings > Platforms > iOS
3. Instalar simulador: Xcode > Settings > Platforms > iOS Simulator
4. Apple Developer Account ativo

### Android
1. **Java JDK 17+**: `brew install openjdk@17`
2. **Android Studio** com SDK 34+ instalado
3. Aceitar licenças: `sdkmanager --licenses`
4. Google Play Developer Account ativo

---

## Build e Deploy — Passo a Passo

### 1. Configurar env de produção

```bash
# Editar .env.production com a PostHog key real
VITE_POSTHOG_KEY=phc_SUA_CHAVE_AQUI
```

### 2. Build web + sync

```bash
npm run cap:sync
```

### 3. iOS — App Store

```bash
# Abrir Xcode
npm run cap:ios

# No Xcode:
# 1. Selecionar Team (Apple Developer Account)
# 2. Selecionar scheme "App" > Any iOS Device (arm64)
# 3. Product > Archive
# 4. Distribute App > App Store Connect > Upload
# 5. Preencher metadata no App Store Connect (ver docs/store-listing.md)
```

**Alternativa (CLI):**
```bash
cd ios/App
xcodebuild archive -scheme App -archivePath build/PetLife.xcarchive -destination 'generic/platform=iOS' CODE_SIGN_IDENTITY="Apple Distribution" DEVELOPMENT_TEAM=SEU_TEAM_ID
xcodebuild -exportArchive -archivePath build/PetLife.xcarchive -exportPath build/export -exportOptionsPlist ExportOptions.plist
```

### 4. Android — Google Play

```bash
# Instalar Java se necessário
brew install openjdk@17

# Abrir Android Studio
npm run cap:android

# OU build pela CLI:
cd android
./gradlew bundleRelease

# O AAB fica em: android/app/build/outputs/bundle/release/app-release.aab
# Upload no Google Play Console > Release > Production
```

**Assinar o AAB:**
- Google Play Console usa Play App Signing
- Upload do AAB não-assinado → Google assina automaticamente
- Para assinatura local: criar keystore com `keytool` e configurar em `android/app/build.gradle`

---

## Configurações necessárias no Railway (backend)

```
FCM_SERVICE_ACCOUNT_JSON=base64_encoded_json   # Firebase Console > Settings > Service Accounts
JWT_SECRET=sua_chave_secreta_segura
JWT_REFRESH_SECRET=outra_chave_secreta
FRONTEND_URL=https://petlife-frontend.up.railway.app
```

---

## Configurar Firebase Cloud Messaging

1. Ir em https://console.firebase.google.com
2. Criar projeto "PetLife"
3. Adicionar app iOS (bundle: com.sanchescreative.petlife) → baixar GoogleService-Info.plist → colocar em `ios/App/App/`
4. Adicionar app Android (package: com.sanchescreative.petlife) → baixar google-services.json → colocar em `android/app/`
5. Settings > Service Accounts > Generate Key → base64 encode → setar como FCM_SERVICE_ACCOUNT_JSON no Railway

---

## Checklist pré-submissão

### App Store Connect
- [ ] Screenshots 6.7" e 6.5" (mínimo 3 cada)
- [ ] App name, subtitle, description, keywords (ver docs/store-listing.md)
- [ ] Categoria: Lifestyle
- [ ] Age rating: 4+
- [ ] Privacy Policy URL: https://petlife-frontend.up.railway.app/privacy
- [ ] Support URL: nikollas@sanchescreative.com
- [ ] Privacy Nutrition Labels preenchido
- [ ] Review Notes: conta teste test@petlife.com / senha123
- [ ] Build uploaded via Xcode

### Google Play Console
- [ ] Screenshots phone (mínimo 2)
- [ ] Store listing completo (ver docs/store-listing.md)
- [ ] Content rating questionnaire respondido
- [ ] Data safety form preenchido
- [ ] Privacy policy URL configurado
- [ ] App bundle (AAB) uploaded
- [ ] Testing tracks: Internal > Closed > Open > Production

---

## Gerar screenshots automaticamente

```bash
# iOS (após instalar simulador)
xcrun simctl boot "iPhone 15 Pro Max"
npm run cap:build:ios
# Abrir app no simulador, navegar pelas telas, usar cmd+S para screenshot

# Android (após instalar emulador)
emulator -avd Pixel_7_API_34 &
npm run cap:build:android
# Screenshots via Android Studio ou adb: adb exec-out screencap -p > screenshot.png
```

---

## Tempo estimado

| Passo | Tempo |
|-------|-------|
| Instalar Java + iOS platform | 15-30 min |
| Configurar Firebase FCM | 15 min |
| Build iOS + upload | 20 min |
| Build Android + upload | 15 min |
| Screenshots (5 telas × 2 plataformas) | 30-60 min |
| Preencher metadata nas lojas | 30 min |
| **Total** | **~2-3 horas** |

Após submissão: review iOS 24-48h, Android até 7 dias (primeira vez).
