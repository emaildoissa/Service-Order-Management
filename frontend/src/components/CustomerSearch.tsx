import { TextField, List, ListItemButton, ListItemText, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { useAsync } from "../hooks/useAsync";
import { customerAPI, Customer } from "../api";

interface Props {
  onSelect(customer: Customer): void;
  onCreateRequest(name: string): void;
}

export default function CustomerSearch({ onSelect, onCreateRequest }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const { loading, run } = useAsync<Customer[]>();

  useEffect(() => {
    const t = setTimeout(() => {
      if (query) {
        run(() => customerAPI.search(query).then(response => response.data)).then((res) => setResults(res || []));
      } else {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <>
      <TextField
        fullWidth
        label="Buscar cliente"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <CircularProgress size={20} />}
      <List dense>
        {results.map((c) => (
          <ListItemButton key={c.id} onClick={() => onSelect(c)}>
            <ListItemText primary={c.name} secondary={c.phone_number} />
          </ListItemButton>
        ))}
        {query && results.length === 0 && !loading && (
          <ListItemButton onClick={() => onCreateRequest(query)}>
            <ListItemText primary={`Cadastrar "${query}"`} />
          </ListItemButton>
        )}
      </List>
    </>
  );
}
