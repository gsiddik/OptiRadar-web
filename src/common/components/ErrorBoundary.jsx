import { Component } from 'react';
import {
  classifyRuntimeError,
  mayReloadAutomatically,
  referenceOf,
  reloadToLatest,
} from '../util/runtimeError';

const isOnline = () => typeof navigator === 'undefined' || navigator.onLine !== false;

// Catches what throws while a part of the app is drawn or loaded, and shows `fallback` instead of a blank window.
// `resetKey` clears the failure when it changes (the person went to another route). A part that could not be loaded
// because the app is stale reloads the page once by itself; the fallback explains it if that does not help.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, reference: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { error: error || new Error('Unknown error'), reference: referenceOf(error) };
  }

  componentDidCatch(error, info) {
    // The details go to the console for support; the screen shows the reference only, never a stack.
    console.error(`[${this.state.reference}]`, error, info && info.componentStack);
    const online = isOnline();
    if (
      classifyRuntimeError(error, online) === 'stale' &&
      mayReloadAutomatically(window.sessionStorage)
    ) {
      reloadToLatest({ online });
    }
  }

  componentDidUpdate(previous) {
    const { resetKey } = this.props;
    const { error } = this.state;
    if (error && previous.resetKey !== resetKey) {
      this.reset();
    }
  }

  reset() {
    this.setState({ error: null, reference: null });
  }

  render() {
    const { error, reference } = this.state;
    const { fallback, children } = this.props;
    if (error) {
      return fallback({ error, reference, reset: this.reset });
    }
    return children;
  }
}

export default ErrorBoundary;
