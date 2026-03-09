import React, { useState } from "react";
import { Avatar, Modal, Box, IconButton, Tooltip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/**
 * ProfilePictureWithHover Component
 * Shows profile picture with hover tooltip (200x200 on left) and click-to-zoom functionality
 *
 * @param {string} src - Profile picture URL
 * @param {string} alt - Alt text (usually player name)
 * @param {number} size - Avatar size (default: 40)
 * @param {number} zoomSize - Zoomed image size (default: 400)
 * @param {object} sx - Additional MUI sx props for Avatar
 */
const ProfilePictureWithHover = ({ src, alt, size = 40, zoomSize = 400, sx = {} }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = (event) => {
    event.stopPropagation(); // Prevent row click
    event.preventDefault(); // Prevent default behavior
    if (src) {
      setOpen(true);
    }
  };

  const handleClose = (event) => {
    if (event) {
      event.stopPropagation(); // Prevent row click
      event.preventDefault(); // Prevent default behavior
    }
    setOpen(false);
  };

  const handleContainerClick = (event) => {
    event.stopPropagation(); // Prevent row click on container
  };

  return (
    <>
      <Tooltip
        title={
          src ? (
            <Box
              component="img"
              src={src}
              alt={alt}
              sx={{
                width: 200,
                height: 200,
                objectFit: "cover",
                borderRadius: 1,
              }}
            />
          ) : (
            ""
          )
        }
        placement="left"
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "transparent",
              padding: 0.5,
              "& .MuiTooltip-arrow": {
                color: "rgba(97, 97, 97, 0.9)",
              },
            },
          },
        }}>
        <Box
          sx={{ position: "relative", display: "inline-block" }}
          onClick={handleContainerClick}>
          <Avatar
            src={src}
            alt={alt}
            onClick={handleOpen}
            sx={{
              width: size,
              height: size,
              cursor: src ? "pointer" : "default",
              ...sx,
            }}>
            {!src && alt ? alt.charAt(0).toUpperCase() : null}
          </Avatar>
        </Box>
      </Tooltip>

      <Modal
        open={open}
        onClose={handleClose}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
        <Box
          sx={{
            outline: "none",
            position: "relative",
            maxWidth: "90vw",
            maxHeight: "90vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <IconButton
            onClick={(e) => handleClose(e)}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "white",
              zIndex: 1,
              "&:hover": {
                backgroundColor: "rgba(0, 0, 0, 0.8)",
              },
            }}>
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={src}
            alt={alt}
            onClick={(e) => handleClose(e)}
            sx={{
              maxWidth: "100%",
              maxHeight: "90vh",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: 2,
              boxShadow: 24,
              cursor: "pointer",
            }}
          />
        </Box>
      </Modal>
    </>
  );
};

export default ProfilePictureWithHover;
