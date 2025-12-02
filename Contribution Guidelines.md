# Contribution Guidelines

Thank you for your interest in contributing to **BabyNest**! We appreciate your efforts in making this project better. Please follow these best practices to ensure smooth collaboration.


## Prerequisites: Local Setup

Before contributing, you need to set up your development environment:

1.⁠ ⁠*Frontend Setup*: Follow the instructions in [Setup.md](./Setup.md) for React Native setup (Node.js, npm/pnpm, Android/iOS tools).
2.⁠ ⁠*Backend Setup*: Install Python 3.8+, Flask, and dependencies as outlined in [Backend README](./Backend/README.md).
3.⁠ ⁠*Verify Installation*: Run the frontend and backend servers locally to ensure everything is working:
   - *Frontend*: ⁠ npm start ⁠ or ⁠ npx react-native run-android/run-ios ⁠
   - *Backend*: ⁠ python app.py ⁠ (from the Backend folder)

For detailed step-by-step instructions, refer to:
•⁠  ⁠[Frontend Setup Guide](./Frontend/Setup.md)
•⁠  ⁠[Backend Setup Guide](./Backend/README.md)
•⁠  ⁠[General Setup Guide](./Setup.md)


## How to Contribute

### 1. Fork the Repository
- Navigate to the [BabyNest repository](https://github.com/AOSSIE-Org/BabyNest/).
- Click the **Fork** button in the top right corner.
- Clone the forked repository to your local machine:
  ```sh
  git clone https://github.com/your-username/BabyNest.git
  cd babynest
  ```

### 2. Create a Feature Branch
- Always create a new branch for your contributions:
  ```sh
  git checkout -b feature-name
  ```

### 3. Make Changes and Commit
- Follow coding best practices and maintain code consistency.
- Write clear commit messages:
  ```sh
  git commit -m "Added [feature/fix]: Short description"
  ```

### 4. Push Changes and Open a Pull Request
- Push your changes to your forked repository:
  ```sh
  git push origin feature-name
  ```
- Navigate to the original repository and open a **Pull Request (PR)**.
- Provide a detailed description of the changes in the PR.

## Best Practices
- **Code Quality**: Ensure code is readable, well-documented, and follows project conventions.
- **Testing**: Test your changes locally before submitting a PR.
- **Security**: Avoid hardcoded credentials or sensitive information in commits.
- **Communication**: Be responsive to feedback on PRs and make necessary changes promptly.

## Submitting a Video Demonstration
To help maintainers understand your changes, submit a short video showcasing the new feature or bug fix:
- Record a short demo.
- Upload the video and share a link in the PR description.

## Reporting Issues
If you find a bug or have a feature request:
- Open an issue [here](https://github.com/AOSSIE-Org/BabyNest/issues ).
- Clearly describe the problem and suggest possible solutions.

We look forward to your contributions! 🚀

