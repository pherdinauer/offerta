package com.offerta;

import android.content.Context;
import com.facebook.react.ReactInstanceManager;

/**
 * Class responsible for loading Flipper inside your React Native application. This is the release
 * flavor of {@link MainApplication}. You can build a variant of your app using this class by
 * running:
 *
 * <p>{@code ./gradlew :app:assembleRelease}
 */
public class ReactNativeFlipper {
  public static void initializeFlipper(Context context, ReactInstanceManager reactInstanceManager) {
    // Do nothing as we don't want to initialize Flipper on Release.
  }
}
