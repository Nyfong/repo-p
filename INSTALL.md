# Installation Instructions

## Quick Fix for "Module not found: Can't resolve 'xlsx'"

The error occurs because the `xlsx` package needs to be installed. Run this command in your terminal:

```bash
npm install xlsx
```

Or install all dependencies:

```bash
npm install
```

## If you encounter permission errors:

1. **Try using sudo (macOS/Linux):**
   ```bash
   sudo npm install xlsx
   ```

2. **Or fix npm permissions:**
   ```bash
   npm config set prefix ~/.npm-global
   export PATH=~/.npm-global/bin:$PATH
   npm install xlsx
   ```

3. **Or use npx to install locally:**
   ```bash
   npx npm install xlsx
   ```

## After installation:

1. Restart your Next.js dev server:
   ```bash
   npm run dev
   ```

2. The Excel export functionality should now work!

## Alternative: Manual Installation

If npm commands fail, you can manually add the package:

1. Open `package.json`
2. Ensure `"xlsx": "^0.18.5"` is in the `dependencies` section
3. Delete `node_modules` and `package-lock.json`
4. Run `npm install` again





