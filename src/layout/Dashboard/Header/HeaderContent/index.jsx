import {Box, Button} from "@mui/material";
import {useNavigate} from "react-router";

export default function HeaderContent() {
  const navigate = useNavigate();
  return (
    <>
      {" "}
      <Box sx={{width: "100% ", ml: 1}} />
      <Button
        size="large"
        type="button"
        variant="outlined"
        color="primary"
        onClick={() => {
          sessionStorage.removeItem("userData");
          navigate("/login");
        }}
      >
      Logout  
      </Button>
    </>
  );
}
