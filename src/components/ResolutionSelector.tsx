import {
  IconButton,
  Menu,
  MenuList,
  MenuItem,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import React, { useState } from 'react';

type ResolutionSelectorProps = {
  onSetResolution: (width: number, height: number) => void;
};

export default function ResolutionSelector({
  onSetResolution,
}: ResolutionSelectorProps) {
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const resolutionMenuOpen = Boolean(menuAnchorEl);
  const openResolutionMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  const setResolution = (
    event: React.MouseEvent<HTMLElement>,
    width: number,
    height: number
  ) => {
    onSetResolution(width, height);
    setMenuAnchorEl(null);
  };
  const closeResolutionMenu = () => {
    setMenuAnchorEl(null);
  };

  return (
    <>
      <IconButton onClick={openResolutionMenu} size="small" color="primary">
        <AspectRatioIcon />
      </IconButton>
      <Menu
        id="resolution-menu"
        anchorEl={menuAnchorEl}
        open={resolutionMenuOpen}
        onClose={closeResolutionMenu}
      >
        <MenuList>
          <ResolutionMenuItem
            width={640}
            height={480}
            ratio="4:3"
            standard="VGA"
            onClick={setResolution}
          />
          <ResolutionMenuItem
            width={800}
            height={600}
            ratio="4:3"
            standard="SVGA"
            onClick={setResolution}
          />
          <ResolutionMenuItem
            width={1024}
            height={768}
            ratio="4:3"
            standard="XGA"
            onClick={setResolution}
          />
          <Divider />
          <ResolutionMenuItem
            width={1024}
            height={576}
            ratio="16:9"
            standard="WSVGA"
            onClick={setResolution}
          />
          <ResolutionMenuItem
            width={1280}
            height={720}
            ratio="16:9"
            standard="WXGA"
            onClick={setResolution}
          />
          <ResolutionMenuItem
            width={1920}
            height={1080}
            ratio="16:9"
            standard="Full HD"
            onClick={setResolution}
          />
          <ResolutionMenuItem
            width={2560}
            height={1440}
            ratio="16:9"
            standard="QHD"
            onClick={setResolution}
          />
          <ResolutionMenuItem
            width={3840}
            height={2160}
            ratio="16:9"
            standard="4K UHD"
            onClick={setResolution}
          />
          <Divider />
          <ResolutionMenuItem
            width={2560}
            height={1080}
            ratio="21:9"
            standard="UWFHD"
            onClick={setResolution}
          />
          <ResolutionMenuItem
            width={3440}
            height={1440}
            ratio="21:9"
            standard="UWQHD"
            onClick={setResolution}
          />
        </MenuList>
      </Menu>
    </>
  );
}

type ResolutionMenuItemProps = {
  width: number;
  height: number;
  ratio: string;
  standard: string;
  onClick: (
    event: React.MouseEvent<HTMLElement>,
    width: number,
    height: number
  ) => void;
};

function ResolutionMenuItem({
  width,
  height,
  ratio,
  standard,
  onClick,
}: ResolutionMenuItemProps) {
  return (
    <MenuItem onClick={(e) => onClick(e, width, height)}>
      <ListItemText sx={{ width: 120 }}>
        {width}x{height}
      </ListItemText>
      <Typography variant="body2" sx={{ color: 'text.secondary', width: 40 }}>
        {ratio}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', width: 60 }}>
        {standard}
      </Typography>
    </MenuItem>
  );
}
