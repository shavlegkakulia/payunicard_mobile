/* @flow */

import * as React from 'react';
import { Animated, TextInput as NativeTextInput, Platform } from 'react-native';
// import { polyfill } from 'react-lifecycles-compat';
import TextInputFlat from './TextInputFlat';
const BLUR_ANIMATION_DURATION = 180;
const FOCUS_ANIMATION_DURATION = 150;

class TextInput extends React.PureComponent {
  static defaultProps = {
    padding: 'normal',
    dense: false,
    disabled: false,
    error: false,
    multiline: false,
    editable: true,
    render: (props) => <NativeTextInput {...props} />,
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    return {
      value:
        typeof nextProps.value !== 'undefined'
          ? nextProps.value
          : prevState.value,
    };
  }

  state = {
    labeled: new Animated.Value(this.props.value || this.props.error ? 0 : 1),
    error: new Animated.Value(this.props.error ? 1 : 0),
    focused: false,
    placeholder: this.props.error ? this.props.placeholder : '',
    value: this.props.value || this.props.defaultValue,
    labelLayout: {
      measured: false,
      width: 0,
      height: 0,
    },
  };

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.focused !== this.state.focused ||
      prevState.value !== this.state.value ||
      prevProps.error !== this.props.error ||
      this.props.defaultValue
    ) {
      // The label should be minimized if the text input is focused, or has text
      // In minimized mode, the label moves up and becomes small
      if (this.state.value || this.state.focused || this.props.error) {
        this._minmizeLabel();
      } else {
        this._restoreLabel();
      }
    }

    if (
      prevState.focused !== this.state.focused ||
      prevProps.label !== this.props.label ||
      prevProps.error !== this.props.error
    ) {
      // Show placeholder text only if the input is focused, or has error, or there's no label
      // We don't show placeholder if there's a label because the label acts as placeholder
      // When focused, the label moves up, so we can show a placeholder
      if (this.state.focused || this.props.error || !this.props.label) {
        this._showPlaceholder();
      } else {
        this._hidePlaceholder();
      }
    }

    if (prevProps.error !== this.props.error) {
      // When the input has an error, we wiggle the label and apply error styles
      if (this.props.error) {
        this._showError();
      } else {
        this._hideError();
      }
    }
  }

  componentWillUnmount() {
    clearTimeout(this._timer);
  }

  _showPlaceholder = () => {
    clearTimeout(this._timer);

    // Set the placeholder in a delay to offset the label animation
    // If we show it immediately, they'll overlap and look ugly
    this._timer = setTimeout(
      () =>
        this.setState({
          placeholder: this.props.placeholder,
        }),
      50
    );
  };

  _hidePlaceholder = () =>
    this.setState({
      placeholder: '',
    });

  _showError = () => {
    Animated.timing(this.state.error, {
      toValue: 1,
      duration: FOCUS_ANIMATION_DURATION,
      // To prevent this - https://github.com/callstack/react-native-paper/issues/941
      useNativeDriver: Platform.select({
        ios: false,
        default: true,
      }),
    }).start(this._showPlaceholder);
  };

  _hideError = () => {
    Animated.timing(this.state.error, {
      toValue: 0,
      duration: BLUR_ANIMATION_DURATION,
      // To prevent this - https://github.com/callstack/react-native-paper/issues/941
      useNativeDriver: Platform.select({
        ios: false,
        default: true,
      }),
    }).start();
  };

  _restoreLabel = () =>
    Animated.timing(this.state.labeled, {
      toValue: 1,
      duration: FOCUS_ANIMATION_DURATION,
      // To prevent this - https://github.com/callstack/react-native-paper/issues/941
      useNativeDriver: Platform.select({
        ios: false,
        default: true,
      }),
    }).start();

  _minmizeLabel = () =>
    Animated.timing(this.state.labeled, {
      toValue: 0,
      duration: BLUR_ANIMATION_DURATION,
      // To prevent this - https://github.com/callstack/react-native-paper/issues/941
      useNativeDriver: Platform.select({
        ios: false,
        default: true,
      }),
    }).start();

  _handleFocus = (...args) => {
    if (this.props.disabled || !this.props.editable) {
      return;
    }

    this.setState({ focused: true });

    if (this.props.onFocus) {
      this.props.onFocus(...args);
    }
  };

  _handleBlur = (...args) => {
    if (this.props.disabled || !this.props.editable) {
      return;
    }

    this.setState({ focused: false });

    if (this.props.onBlur) {
      this.props.onBlur(...args);
    }
  };

  _handleChangeText = (value) => {
    if (!this.props.editable) {
      return;
    }

    this.setState({ value });
    this.props.onChangeText && this.props.onChangeText(value);
  };

  _onLayoutAnimatedText = e => {
    this.setState({
      labelLayout: {
        width: e.nativeEvent.layout.width,
        height: e.nativeEvent.layout.height,
        measured: true,
      },
    });
  };

  /**
   * @internal
   */
  setNativeProps(...args) {
    return this._root && this._root.setNativeProps(...args);
  }

  /**
   * Returns `true` if the input is currently focused, `false` otherwise.
   */
  isFocused() {
    return this._root && this._root.isFocused();
  }

  /**
   * Removes all text from the TextInput.
   */
  clear() {
    return this._root && this._root.clear();
  }

  /**
   * Focuses the input.
   */
  focus() {
    return this._root && this._root.focus();
  }

  /**
   * Removes focus from the input.
   */
  blur() {
    return this._root && this._root.blur();
  }

  render() {
    const { padding, ...rest } = this.props;

    return <TextInputFlat
      {...rest}
      parentState={this.state}
      innerRef={this.props.innerRef}
      padding={padding}
      onFocus={this._handleFocus}
      onBlur={this._handleBlur}
      onChangeText={this._handleChangeText}
      onLayoutAnimatedText={this._onLayoutAnimatedText} />
  }
}

// polyfill(TextInput);

export default TextInput;
