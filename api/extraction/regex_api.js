
module.exports.findAddresses = function(textAsHtml) {
  const matches = textAsHtml.match(/(\d+\w*\-*\w*)\s(\w+\-*\w+)/ig) || []
  console.log(matches)
  return matches
}

module.exports.findURLS = function(textAsHtml) {
  const matches = textAsHtml.match(/((https:\/\/)|(http:\/\/))?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig) || []
  console.log(matches)
  return matches
}

/*

module.exports.findAddresses(`
    <p>________________________________<br/>From: <a href="mailto:jxayaban@uwaterloo.ca">jxayaban@uwaterloo.ca</a> <a href="mailto:&amp;lt;jxayaban@uwaterloo.ca">&amp;lt;jxayaban@uwaterloo.ca</a>&gt;<br/>Sent: Wednesday, June 27, 2018 11:34 AM<br/>Subject: Last chance to register for the Investment Research Challenge 2018!</p><p>[<a href="https://uwaterloo.ca/school-of-accounting-and-finance/sites/ca.school-of-accounting-and-finance/files/uploads/images/experiencematters_banner_-_coopcareer.jpg">https://uwaterloo.ca/school-of-accounting-and-finance/sites/ca.school-of-accounting-and-finance/files/uploads/images/experiencematters_banner_-_coopcareer.jpg</a>]</p><p>Hello SAF Students,</p><p>This is a reminder that today is the last day to register for the Investment Research Challenge 2018&lt;<a href="https://learn.uwaterloo.ca/d2l/common/dialogs/quickLink/quickLink.d2l?ou=66209&amp;amp;type=survey&amp;amp;rCode=uWaterloo-1370606&amp;gt;">https://learn.uwaterloo.ca/d2l/common/dialogs/quickLink/quickLink.d2l?ou=66209&amp;amp;type=survey&amp;amp;rCode=uWaterloo-1370606&amp;gt;</a> as the application closes at 11:59 p.m. This competition is an excellent opportunity for students to demonstrate their knowledge and skills in Finance. You will also get the opportunity to network with industry professionals and gain valuable feedback in the process.</p><p>For more information about the 34 Investment Research Challenge, please refer to the attached document.</p><p>Best wishes,</p><p>Jonathan Xayabanha<br/>Coordinator, Student Initiatives &amp; CPA Ontario Centre for Performance Management Research and Education<br/>School of Accounting and Finance<br/>University of Waterloo<br/>519-888-4567, ext. 36879</p>
  `)

module.exports.findURLS(`
  <p>________________________________<br/>From: <a href="mailto:jxayaban@uwaterloo.ca">jxayaban@uwaterloo.ca</a> <a href="mailto:&amp;lt;jxayaban@uwaterloo.ca">&amp;lt;jxayaban@uwaterloo.ca</a>&gt;<br/>Sent: Wednesday, June 27, 2018 11:34 AM<br/>Subject: Last chance to register for the Investment Research Challenge 2018!</p><p>[<a href="https://uwaterloo.ca/school-of-accounting-and-finance/sites/ca.school-of-accounting-and-finance/files/uploads/images/experiencematters_banner_-_coopcareer.jpg">https://uwaterloo.ca/school-of-accounting-and-finance/sites/ca.school-of-accounting-and-finance/files/uploads/images/experiencematters_banner_-_coopcareer.jpg</a>]</p><p>Hello SAF Students,</p><p>This is a reminder that today is the last day to register for the Investment Research Challenge 2018&lt;<a href="https://learn.uwaterloo.ca/d2l/common/dialogs/quickLink/quickLink.d2l?ou=66209&amp;amp;type=survey&amp;amp;rCode=uWaterloo-1370606&amp;gt;">https://learn.uwaterloo.ca/d2l/common/dialogs/quickLink/quickLink.d2l?ou=66209&amp;amp;type=survey&amp;amp;rCode=uWaterloo-1370606&amp;gt;</a> as the application closes at 11:59 p.m. This competition is an excellent opportunity for students to demonstrate their knowledge and skills in Finance. You will also get the opportunity to network with industry professionals and gain valuable feedback in the process.</p><p>For more information about the 34 Investment Research Challenge, please refer to the attached document.</p><p>Best wishes,</p><p>Jonathan Xayabanha<br/>Coordinator, Student Initiatives &amp; CPA Ontario Centre for Performance Management Research and Education<br/>School of Accounting and Finance<br/>University of Waterloo<br/>519-888-4567, ext. 36879</p>
  `)

*/
