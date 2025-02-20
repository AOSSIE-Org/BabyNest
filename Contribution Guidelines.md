# Contribution Guidelines

Thank you for your interest in contributing to **BabyNest**! We appreciate your efforts in making this project better. Please follow these best practices to ensure smooth collaboration.

## How to Contribute

### 1. Fork the Repository
- Navigate to the [BabyNest repository](https://github.com/AOSSIE-Org/BabyNest/).
- Click the **Fork** button in the top right corner.
- Clone the forked repository to your local machine:
  ```sh
  git clone https://github.com/your-username/babynest.git
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
  

## Write Effective Commit Messages

Clear, concise, and meaningful commit messages help maintain a readable history of changes. Follow these guidelines for writing commit messages:

- **Use present tense**: Commit messages should describe what *this commit does*, not what *it did* (e.g., "Fix bug in validation logic" rather than "Fixed bug").
- **Be descriptive, but concise**: Summarize what you changed and why in a single line if possible. If more detail is needed, provide additional explanation in the body of the message.

### Example Commit Message:
```
Fix user authentication issue after password reset

- Users were unable to log in after resetting their password due to a session mismatch.
- Added a check to synchronize the session after a password reset.
```

### Create Meaningful Pull Request Titles and Descriptions

When submitting a pull request (PR), it's important to make the title and description clear and easy to understand. Here’s how to do it:

### Pull Request Title:
- **Be specific**: Clearly describe what the pull request accomplishes. 
- **Use imperative mood**: Like with commit messages, use the present tense (e.g., "Add new login screen" instead of "Added new login screen").

### Example PR Title:
```
Fix user authentication issue after password reset
```

### Pull Request Description:
Provide a detailed explanation of the following in your PR description:
- **What**: A brief overview of the change you made.
- **Why**: Explain why this change is necessary.
- **How**: If applicable, provide context on how you implemented the change.

### Example PR Description:
```
## What:
This pull request fixes an issue where users were unable to log in after resetting their password.

## Why:
Users reported issues with authentication after password reset. This fix ensures the session is synchronized post-reset.

## How:
Added logic to check the session after a password reset and synchronize it with the new user credentials.
```

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
- Open an issue [here](https://github.com/your-repo/babynest/issues).
- Clearly describe the problem and suggest possible solutions.


If you have any questions, feel free to reach out by opening an issue, or ask in the project’s discussion channel. We are happy to help!
We look forward to your contributions! 🚀

