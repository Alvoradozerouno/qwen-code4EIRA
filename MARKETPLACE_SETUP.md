# Marketplace Setup — VS Code & Cursor

Einmalige Schritte, um die Extension öffentlich auf dem VS Code Marketplace und Open VSX (für Cursor) zu veröffentlichen.

---

## Voraussetzungen

- GitHub Repository: `Alvoradozerouno/qwen-code4EIRA`
- Publisher ID: `Alvoradozerouno` (muss registriert werden, siehe unten)

---

## Schritt 1: VS Code Marketplace Publisher registrieren

1. Gehe auf [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)
2. Melde dich mit einem **Microsoft-Konto** an (kostenfrei erstellen unter account.microsoft.com)
3. Klick auf **Create publisher**
4. Fülle aus:
   - **ID**: `Alvoradozerouno` ← muss exakt so heißen wie in `package.json`
   - **Display Name**: `Alvoradozerouno` oder `Genesis Copilot`
   - **Description**: Optional
5. Bestätige mit **Create**

---

## Schritt 2: VSCE Personal Access Token erstellen

1. Gehe auf [dev.azure.com](https://dev.azure.com) → melde dich mit demselben Microsoft-Konto an
2. Klick oben rechts auf **User settings** → **Personal access tokens**
3. Klick auf **New Token**:
   - **Name**: `vsce-publish`
   - **Organization**: **All accessible organizations**
   - **Expiration**: 1 year
   - **Scopes**: Custom defined →
     - **Marketplace** → `Manage` (Haken setzen)
4. Klick auf **Create** → Token kopieren (wird nur einmal angezeigt!)

---

## Schritt 3: VSCE_PAT zu GitHub Secrets hinzufügen

1. Gehe auf: [github.com/Alvoradozerouno/qwen-code4EIRA/settings/secrets/actions](https://github.com/Alvoradozerouno/qwen-code4EIRA/settings/secrets/actions)
2. Klick auf **New repository secret**
3. Name: `VSCE_PAT`
4. Value: dein Token aus Schritt 2
5. **Add secret**

---

## Schritt 4: Open VSX Token erstellen (für Cursor)

1. Gehe auf [open-vsx.org](https://open-vsx.org)
2. **Login with GitHub** → authorize
3. Klick auf deinen Avatar → **Settings** → **Access Tokens**
4. Klick **Generate new token**:
   - Description: `cursor-publish`
   - Scopes: `publish`
5. Token kopieren

---

## Schritt 5: OVSX_TOKEN zu GitHub Secrets hinzufügen

1. Gehe auf: [github.com/Alvoradozerouno/qwen-code4EIRA/settings/secrets/actions](https://github.com/Alvoradozerouno/qwen-code4EIRA/settings/secrets/actions)
2. **New repository secret**
3. Name: `OVSX_TOKEN`
4. Value: dein Open VSX Token
5. **Add secret**

---

## Schritt 6: PR mergen und Release triggern

### 6a. PR mergen

Merge den PR `copilot/refactor-qwen-extension-openrouter` → `main`.

### 6b. Release Workflow triggern

1. Gehe auf: [github.com/Alvoradozerouno/qwen-code4EIRA/actions](https://github.com/Alvoradozerouno/qwen-code4EIRA/actions)
2. Wähle: **Release VSCode IDE Companion**
3. Klick auf **Run workflow**
4. Parameter:
   - `ref`: `main`
   - `dry_run`: **false**
   - `create_preview_release`: false
   - `force_skip_tests`: false
5. **Run workflow**

---

## Ergebnis (nach ~10 Minuten)

| Store               | URL                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| VS Code Marketplace | https://marketplace.visualstudio.com/items?itemName=Alvoradozerouno.genesis-copilot-orion-kernel |
| Open VSX (Cursor)   | https://open-vsx.org/extension/Alvoradozerouno/genesis-copilot-orion-kernel                      |

---

## Installation für Nutzer

### VS Code

```bash
code --install-extension Alvoradozerouno.genesis-copilot-orion-kernel
```

Oder: Extensions Panel → suche `Genesis Copilot Orion Kernel` → Install

### Cursor

Extensions Panel → `⋯` → _Install from VSIX..._ → .vsix aus GitHub Releases

---

## VSIX direkt bauen (ohne Marketplace)

Falls du nur eine .vsix-Datei für manuelle Verteilung brauchst:

```bash
# Lokal bauen
npm install
npm run build && npm run bundle
UNIVERSAL_BUILD=true npm --workspace=genesis-copilot-orion-kernel run prepackage
cd packages/vscode-ide-companion
npx @vscode/vsce package --no-dependencies
```

Oder über GitHub Actions:
→ Actions → **Build & Release VSIX** → `dry_run=true` → Download aus Artifacts

---

## Troubleshooting

| Problem                     | Lösung                                                 |
| --------------------------- | ------------------------------------------------------ |
| "Publisher not found"       | Publisher in Step 1 erstellen, genau `Alvoradozerouno` |
| "Unauthorized" beim publish | VSCE_PAT prüfen, Scope muss `Marketplace: Manage` sein |
| "Extension already exists"  | `--skip-duplicate` ist bereits im Workflow             |
| Open VSX "Forbidden"        | OVSX_TOKEN neu generieren                              |
