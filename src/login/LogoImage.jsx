import { useTheme, useMediaQuery } from '@mui/material';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import logoDefault from '../resources/images/logo.png';
import logoDefaultInverted from '../resources/images/logo-inverted.png';

const useStyles = makeStyles()((theme) => ({
  image: {
    alignSelf: 'center',
    display: 'block',
    boxSizing: 'border-box',
    width: `calc(100% - ${theme.spacing(4)})`,
    maxWidth: '240px',
    maxHeight: '120px',
    height: 'auto',
    objectFit: 'contain',
    margin: theme.spacing(2),
  },
}));

const LogoImage = () => {
  const theme = useTheme();
  const { classes } = useStyles();

  const expanded = !useMediaQuery(theme.breakpoints.down('lg'));

  const logo = useSelector((state) => state.session.server.attributes?.logo);
  const logoInverted = useSelector((state) => state.session.server.attributes?.logoInverted);

  if (logo) {
    if (expanded && logoInverted) {
      return <img className={classes.image} src={logoInverted} alt="" />;
    }
    return <img className={classes.image} src={logo} alt="" />;
  }

  // Expanded layout draws the logo on the primary-colored sidebar, otherwise it sits on the page background
  const background = expanded ? theme.palette.primary.main : theme.palette.background.paper;
  const darkBackground = theme.palette.getContrastText(background) === theme.palette.common.white;
  return (
    <img
      className={classes.image}
      src={darkBackground ? logoDefaultInverted : logoDefault}
      alt="OptiRadar"
    />
  );
};

export default LogoImage;
