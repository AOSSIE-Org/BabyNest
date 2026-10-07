#import "SMSComposer.h"
#import <React/RCTUtils.h>

@implementation SMSComposer

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_METHOD(sendSMS:(NSString *)recipient
                  body:(NSString *)body
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    if (![MFMessageComposeViewController canSendText]) {
      reject(@"E_SMS_UNAVAILABLE", @"SMS is not available on this device", nil);
      return;
    }

    UIViewController *rootVC = RCTPresentedViewController();
    if (!rootVC) {
      reject(@"E_NO_VIEW_CONTROLLER", @"Cannot present message composer", nil);
      return;
    }

    MFMessageComposeViewController *composer = [[MFMessageComposeViewController alloc] init];
    composer.messageComposeDelegate = self;
    if (recipient && [recipient length] > 0) {
      composer.recipients = @[recipient];
    }
    if (body) {
      composer.body = body;
    }

    [rootVC presentViewController:composer animated:YES completion:^{
      resolve(@(YES));
    }];
  });
}

- (void)messageComposeViewController:(MFMessageComposeViewController *)controller
                 didFinishWithResult:(MessageComposeResult)result
{
  [controller dismissViewControllerAnimated:YES completion:nil];
}

@end
