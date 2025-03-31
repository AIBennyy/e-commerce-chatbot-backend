# Heroku Deployment Troubleshooting Guide

## Issue: Package.json and Package-lock.json Out of Sync

### Problem Description
The Heroku build was failing with the following error:
```
npm error code EUSAGE
npm error
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync. Please update your lock file with `npm install` before continuing.
npm error
npm error Missing: axios-mock-adapter@1.22.0 from lock file
npm error Missing: is-buffer@2.0.5 from lock file
```

This error occurs when the dependencies listed in `package.json` don't match those in `package-lock.json`. In this specific case, two dependencies were missing from the lock file:
1. axios-mock-adapter@1.22.0
2. is-buffer@2.0.5

### Root Cause
The issue was likely caused by one of the following:
1. Adding dependencies to `package.json` without running `npm install` to update the lock file
2. Using different npm versions across development environments
3. Manual edits to either file without synchronizing them

### Solution
The solution was to regenerate the `package-lock.json` file by running:
```bash
npm install
```

This command reads the dependencies from `package.json` and creates a new `package-lock.json` file with all the correct dependencies and their versions.

### Verification
After running `npm install`, we verified that both missing dependencies were properly added to the lock file:
- axios-mock-adapter@1.22.0
- is-buffer@2.0.5 (as a dependency of axios-mock-adapter)

### Prevention Tips
To prevent this issue in the future:
1. Always run `npm install` after manually editing `package.json`
2. Use the same npm version across all development environments
3. Commit both `package.json` and `package-lock.json` files together
4. Consider using `npm ci` in your local environment to catch these issues before deployment

### Heroku Deployment Best Practices
1. Ensure all dependencies are properly listed in both `package.json` and `package-lock.json`
2. Test your build process locally before pushing to Heroku
3. Use the same Node.js and npm versions locally as specified in your `package.json` engines field
4. Review Heroku build logs carefully to identify specific error messages

## Additional Resources
- [Heroku Node.js Support Documentation](https://devcenter.heroku.com/articles/nodejs-support)
- [npm Documentation on package-lock.json](https://docs.npmjs.com/cli/v9/configuring-npm/package-lock-json)
- [Troubleshooting Node.js Deploys on Heroku](https://devcenter.heroku.com/articles/troubleshooting-node-deploys)
