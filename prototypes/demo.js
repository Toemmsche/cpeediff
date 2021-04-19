const LCSDiff = require("./LCSDiff");

let xml1 = "<description xmlns=\"http://cpee.org/ns/description/1.0\">\n" +
    "<call id=\"a1\" endpoint=\"\">\n" +
    "<parameters>\n" +
    "<label/>\n" +
    "<method>:post</method>\n" +
    "<arguments/>\n" +
    "<stream>\n" +
    "<sensors/>\n" +
    "<ips/>\n" +
    "</stream>\n" +
    "<report>\n" +
    "<url/>\n" +
    "</report>\n" +
    "</parameters>\n" +
    "<code>\n" +
    "<prepare/>\n" +
    "<finalize output=\"result\"/>\n" +
    "<update output=\"result\"/>\n" +
    "<rescue output=\"result\"/>\n" +
    "</code>\n" +
    "<annotations>\n" +
    "<_timing>\n" +
    "<_timing_weight/>\n" +
    "<_timing_avg/>\n" +
    "<explanations/>\n" +
    "</_timing>\n" +
    "<_notes>\n" +
    "<_notes_general/>\n" +
    "</_notes>\n" +
    "</annotations>\n" +
    "<input/>\n" +
    "<output/>\n" +
    "<implementation>\n" +
    "<description/>\n" +
    "</implementation>\n" +
    "<code>\n" +
    "<description/>\n" +
    "</code>\n" +
    "</call>\n" +
    "<call id=\"a2\" endpoint=\"\">\n" +
    "<parameters>\n" +
    "<label/>\n" +
    "<method>:post</method>\n" +
    "<arguments/>\n" +
    "<stream>\n" +
    "<sensors/>\n" +
    "<ips/>\n" +
    "</stream>\n" +
    "<report>\n" +
    "<url/>\n" +
    "</report>\n" +
    "</parameters>\n" +
    "<annotations>\n" +
    "<_timing>\n" +
    "<_timing_weight/>\n" +
    "<_timing_avg/>\n" +
    "<explanations/>\n" +
    "</_timing>\n" +
    "<_notes>\n" +
    "<_notes_general/>\n" +
    "</_notes>\n" +
    "</annotations>\n" +
    "<input/>\n" +
    "<output/>\n" +
    "<implementation>\n" +
    "<description/>\n" +
    "</implementation>\n" +
    "</call>\n" +
    "</description>";

let xml2 = "<description xmlns=\"http://cpee.org/ns/description/1.0\">\n" +
    "<call id=\"a3\" endpoint=\"DUMMY\">\n" +
    "<parameters>\n" +
    "<label>ADDEDTASK</label>\n" +
    "<method>:get</method>\n" +
    "<arguments/>\n" +
    "<report>\n" +
    "<url/>\n" +
    "</report>\n" +
    "<stream>\n" +
    "<sensors/>\n" +
    "<ips/>\n" +
    "</stream>\n" +
    "</parameters>\n" +
    "<annotations>\n" +
    "<_timing>\n" +
    "<_timing_weight/>\n" +
    "<_timing_avg/>\n" +
    "<explanations/>\n" +
    "</_timing>\n" +
    "<_notes>\n" +
    "<_notes_general/>\n" +
    "</_notes>\n" +
    "</annotations>\n" +
    "<input/>\n" +
    "<output/>\n" +
    "<implementation>\n" +
    "<description/>\n" +
    "</implementation>\n" +
    "</call>\n" +
    "<call id=\"a1\" endpoint=\"\">\n" +
    "<parameters>\n" +
    "<label/>\n" +
    "<method>:post</method>\n" +
    "<arguments/>\n" +
    "<stream>\n" +
    "<sensors/>\n" +
    "<ips/>\n" +
    "</stream>\n" +
    "<report>\n" +
    "<url/>\n" +
    "</report>\n" +
    "</parameters>\n" +
    "<code>\n" +
    "<prepare/>\n" +
    "<finalize output=\"result\"/>\n" +
    "<update output=\"result\"/>\n" +
    "<rescue output=\"result\"/>\n" +
    "</code>\n" +
    "<annotations>\n" +
    "<_timing>\n" +
    "<_timing_weight/>\n" +
    "<_timing_avg/>\n" +
    "<explanations/>\n" +
    "</_timing>\n" +
    "<_notes>\n" +
    "<_notes_general/>\n" +
    "</_notes>\n" +
    "</annotations>\n" +
    "<input/>\n" +
    "<output/>\n" +
    "<implementation>\n" +
    "<description/>\n" +
    "</implementation>\n" +
    "<code>\n" +
    "<description/>\n" +
    "</code>\n" +
    "</call>\n" +
    "<call id=\"a2\" endpoint=\"\">\n" +
    "<parameters>\n" +
    "<label/>\n" +
    "<method>:post</method>\n" +
    "<arguments/>\n" +
    "<stream>\n" +
    "<sensors/>\n" +
    "<ips/>\n" +
    "</stream>\n" +
    "<report>\n" +
    "<url/>\n" +
    "</report>\n" +
    "</parameters>\n" +
    "<annotations>\n" +
    "<_timing>\n" +
    "<_timing_weight/>\n" +
    "<_timing_avg/>\n" +
    "<explanations/>\n" +
    "</_timing>\n" +
    "<_notes>\n" +
    "<_notes_general/>\n" +
    "</_notes>\n" +
    "</annotations>\n" +
    "<input/>\n" +
    "<output/>\n" +
    "<implementation>\n" +
    "<description/>\n" +
    "</implementation>\n" +
    "</call>\n" +
    "</description>";

let test = new LCSDiff(xml1, xml2);
test.diff();
