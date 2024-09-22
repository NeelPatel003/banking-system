/* eslint-disable react/prop-types */
// material-ui
import Link from "@mui/material/Link";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";

// ==============================|| ORDER TABLE - HEADER ||============================== //

// eslint-disable-next-line react/prop-types
function OrderTableHead({columns}) {
  return (
    <TableHead>
      <TableRow>
        {columns?.map((headCell) => (
          <TableCell key={headCell.id} align={headCell.align}>
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

// ==============================|| ORDER TABLE ||============================== //
// eslint-disable-next-line react/prop-types
export default function TransactionHistoryTable({data, columns}) {
  return (
    <Box>
      <TableContainer
        sx={{
          width: "100%",
          overflowX: "auto",
          position: "relative",
          display: "block",
          maxWidth: "100%",
          "& td, & th": {whiteSpace: "nowrap"}
        }}
      >
        <Table aria-labelledby="tableTitle">
          <OrderTableHead columns={columns} />
          <TableBody>
            {data?.length ? (
              data?.map((row, index) => {
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    role="checkbox"
                    sx={{"&:last-child td, &:last-child th": {border: 0}}}
                    tabIndex={-1}
                    key={row?.id}
                  >
                    <TableCell component="th" id={labelId} scope="row">
                      <Link color="secondary"> {index + 1}</Link>
                    </TableCell>
                    <TableCell>{row?.description}</TableCell>
                    <TableCell align="left">{row?.transaction_type}</TableCell>
                    <TableCell align="right">{row?.amount}</TableCell>
                    <TableCell>{row?.currency}</TableCell>
                    <TableCell align="right">{row?.total_balance}</TableCell>
                    <TableCell align="right">{row?.timestamp}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow hover role="checkbox" sx={{"&:last-child td, &:last-child th": {border: 0}}}>
                {" "}
                <TableCell component="th">
                  <Link color="secondary">Data Not Found</Link>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
