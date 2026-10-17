import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  CircularProgress,
  Divider,
  IconButton,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import AppsIcon from '@mui/icons-material/Apps';
import { messagesActions } from '../../store';
import { useTranslation } from './LocalizationProvider';
import { describeError } from '../util/describeError';
import { useProducts } from '../util/useProducts';

// Items for a Menu: the other products the person may open. The list is asked again when the menu opens, and again just
// before leaving for a product (the access may have ended meanwhile); a product that is gone or an answer that cannot
// be checked keeps the person here with a message. A click with a modifier key follows the link as the browser would
// (the other product decides access itself).
export const ProductMenuItems = ({ open, onNavigate, onLayout, showEmpty, trailingDivider }) => {
  const t = useTranslation();
  const dispatch = useDispatch();
  const { available, central, status, products, error, load } = useProducts(open);
  const [leaving, setLeaving] = useState(null);

  // The list arrives after the menu opened: the menu must place itself again for its new height.
  useEffect(() => {
    onLayout?.();
  }, [status, products.length, onLayout]);

  const warn = (message) => dispatch(messagesActions.push({ message, severity: 'warning' }));

  const handleClick = async (event, product) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    if (!central) {
      onNavigate?.();
      window.location.assign(product.url);
      return;
    }
    setLeaving(product.code);
    try {
      const fresh = await load(true);
      const target = fresh.find((item) => item.code === product.code);
      if (target) {
        onNavigate?.();
        window.location.assign(target.url);
      } else {
        warn(t('productSwitcherGone'));
      }
    } catch (failure) {
      // A session that ended is handled for the whole app; anything else keeps the person here.
      if (!(failure && failure.sessionEnded)) {
        warn(t('productSwitcherCheckFailed'));
      }
    } finally {
      setLeaving(null);
    }
  };

  if (!available || (status === 'idle' && central) || (central && !open)) {
    return null;
  }
  const items = [<Divider key="product-divider" />];
  items.push(
    <ListSubheader key="product-title" disableSticky>
      {t('productSwitcherTitle')}
    </ListSubheader>,
  );
  if (status === 'loading' && !products.length) {
    items.push(
      <MenuItem key="product-loading" disabled>
        <CircularProgress size={16} sx={{ mr: 1 }} />
        <ListItemText primary={t('productSwitcherLoading')} />
      </MenuItem>,
    );
  } else if (status === 'error') {
    const info = describeError(error, t);
    items.push(
      <MenuItem key="product-error" disabled sx={{ whiteSpace: 'normal', maxWidth: 280 }}>
        <ListItemText
          primary={t('productSwitcherUnavailable')}
          secondary={info.reference ? `${t('stateReference')}: ${info.reference}` : info.detail}
        />
      </MenuItem>,
      <MenuItem key="product-retry" onClick={() => load(true).catch(() => {})}>
        {t('stateRetry')}
      </MenuItem>,
    );
  } else if (!products.length) {
    if (!showEmpty) {
      return null;
    }
    items.push(
      <MenuItem key="product-none" disabled>
        <ListItemText primary={t('productSwitcherNone')} />
      </MenuItem>,
    );
  } else {
    products.forEach((product) =>
      items.push(
        <MenuItem
          key={product.code}
          component="a"
          href={product.url}
          disabled={leaving !== null}
          onClick={(event) => handleClick(event, product)}
        >
          {leaving === product.code && <CircularProgress size={16} sx={{ mr: 1 }} />}
          <ListItemText primary={product.name} />
        </MenuItem>,
      ),
    );
  }
  if (trailingDivider) {
    items.push(<Divider key="product-end" />);
  }
  return items;
};

// The same list as a button with a menu, for the desktop pages that have no bottom bar. Draws nothing for a person who
// has no other product.
export const ProductSwitcherButton = () => {
  const t = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuActionsRef = useRef(null);
  const { available } = useProducts(false);

  if (!available) {
    return null;
  }
  return (
    <>
      <Tooltip title={t('productSwitcherTitle')}>
        <IconButton
          color="inherit"
          aria-label={t('productSwitcherTitle')}
          aria-haspopup="menu"
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <AppsIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        action={menuActionsRef}
      >
        <ProductMenuItems
          open={Boolean(anchorEl)}
          onNavigate={() => setAnchorEl(null)}
          onLayout={() => menuActionsRef.current?.updatePosition()}
          showEmpty
        />
      </Menu>
    </>
  );
};
