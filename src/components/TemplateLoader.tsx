import { Button, Menu, MenuList, MenuItem } from '@mui/material';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import React, { useState } from 'react';
import { SceneTemplate, loadSceneDefinition } from '../scenes/scene-template';
import { SceneDefinition } from '../scenes/scene-definition';

type TemplateLoaderProps = {
  onLoaded: (sceneDefinition: SceneDefinition) => void;
};

export default function TemplateLoader({ onLoaded }: TemplateLoaderProps) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const templateMenuOpen = Boolean(menuAnchorEl);
  const openTemplateMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const loadTemplate = (key: SceneTemplate) => {
    onLoaded(loadSceneDefinition(key));
    setMenuAnchorEl(null);
  };
  const closeTemplateMenu = () => {
    setMenuAnchorEl(null);
  };

  return (
    <>
      <Button
        onClick={openTemplateMenu}
        variant="outlined"
        size="small"
        color="primary"
        startIcon={<FileOpenIcon />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Open template
      </Button>
      <Menu
        id="template-menu"
        anchorEl={menuAnchorEl}
        open={templateMenuOpen}
        onClose={closeTemplateMenu}
      >
        <MenuList>
          {(
            Object.keys(SceneTemplate) as Array<keyof typeof SceneTemplate>
          ).map((key) => (
            <MenuItem
              key={key}
              onClick={() => loadTemplate(SceneTemplate[key])}
            >
              {SceneTemplate[key]}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </>
  );
}
