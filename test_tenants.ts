import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
let supabaseUrl = "";
let supabaseKey = "";

env.split("\n").forEach(line => {
  if (line.startsWith("VITE_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1].replace(/"/g, "").trim();
  }
  if (line.startsWith("VITE_SUPABASE_PUBLISHABLE_KEY=")) {
    supabaseKey = line.split("=")[1].replace(/"/g, "").trim();
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from("tenants").select("id, name, subdomain, custom_domain, status");
  if (error) {
    console.error(error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}
run();