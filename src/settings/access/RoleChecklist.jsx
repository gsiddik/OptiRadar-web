import { Checkbox, FormControlLabel, FormGroup, Typography } from '@mui/material';

// A list of OptiNexus roles to choose from (checkboxes). `roles` come from the delegation catalog.
const RoleChecklist = ({ roles, value, onChange, emptyText }) => {
  if (!roles.length) {
    return <Typography color="textSecondary">{emptyText}</Typography>;
  }
  const toggle = (id) =>
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  return (
    <FormGroup>
      {roles.map((role) => (
        <FormControlLabel
          key={role.id}
          control={
            <Checkbox
              size="small"
              checked={value.includes(role.id)}
              onChange={() => toggle(role.id)}
            />
          }
          label={
            <>
              {role.name}
              {role.description && (
                <Typography variant="caption" color="textSecondary" component="div">
                  {role.description}
                </Typography>
              )}
            </>
          }
        />
      ))}
    </FormGroup>
  );
};

export default RoleChecklist;
