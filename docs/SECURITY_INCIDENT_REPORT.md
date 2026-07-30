# Security Incident Report

**Date:** April 23, 2026  
**Server:** Hostinger VPS (IP: 72.62.254.60)  
**Severity:** Critical  
**Status:** Resolved

---

## Error Description

### What Happened
The server's CPU usage spiked to abnormally high levels (196% CPU usage), causing severe performance degradation across all hosted projects. Upon investigation, a malicious cryptocurrency mining program was discovered running on the server.

### Symptoms Observed
- Extremely high CPU usage (196%)
- Server performance severely degraded
- Process `./chronyd2 --config=.xmr.json` consuming excessive resources
- Three production projects affected: jajr-project, v2_attendance, and attendance
- The backend is trying to use port 5000 instead of 5002. Check your .env file:

```bash
cat /var/www/version2_attendance/backend/.env
```

Ensure it has:
```
PORT=5002
NODE_ENV=production
DATABASE_URL="mysql://root:JaJr12390786@localhost:3306/attendance-system"
```

Then restart:
```bash
pm2 restart v2_attendance-api --update-env
pm2 logs v2_attendance-api --lines 30
```

### Impact
- Reduced server performance for all users
- Potential data security risk
- Unauthorized use of server resources
- Financial loss due to wasted computing resources

---

## Root Cause Analysis

### Attack Vector
The server was compromised through an SSH brute-force attack. An attacker from IP address **146.70.199.168** successfully guessed the root password and gained unauthorized access to the server.

### Attack Timeline
- **April 22, 2026 at 23:27:** Attacker made 4 rapid SSH login attempts within seconds
- **April 23, 2026 at 00:17:** Attacker returned with 4 more rapid SSH connections
- **April 23, 2026 at 00:17-08:00:** Malicious cryptocurrency miner installed and running

### What Was Installed
The attacker installed a **Monero (XMR) cryptocurrency miner** with the following components:

1. **Malicious Executable:** `chronyd2` - A cryptocurrency mining program
2. **Configuration File:** `.xmr.json` - Settings for mining pool connection
3. **Persistence Mechanism:** Cron jobs set to restart the miner every 3 minutes

### Installation Locations
The malware was hidden in system directories to avoid detection:
- `/dev/shm/.kernel/` and `/dev/shm/.dbus-bb/` (shared memory - avoids disk detection)
- `/root/.local/share/..dbus-bb/` and `/root/.cache/..dbus-bb/` (backup persistence)
- `/root/.local/share/..kernel/` and `/root/.cache/..kernel/` (backup persistence)

### Why CPU Usage Was High
Cryptocurrency mining is intentionally computationally intensive. The miner uses the server's CPU to solve complex mathematical puzzles that generate cryptocurrency for the attacker. This process requires massive computing power, which is why the CPU usage reached 196%.

### Attacker's Motivation
The attacker's goal was to:
- Use the server's CPU power to mine cryptocurrency for their financial gain
- Hide the miner in system directories to avoid detection by administrators
- Set up automatic restart mechanisms so the miner continues running after reboots
- Exploit the server without the owner's knowledge

### How They Gained Access
The attacker exploited:
1. **Weak SSH password** - The root password was either too simple or had been leaked in a data breach
2. **No rate limiting** - The server allowed unlimited SSH login attempts
3. **Password-only authentication** - No SSH key authentication was configured
4. **No intrusion detection** - No system to block suspicious login patterns

---

## Solution Implemented

### Immediate Actions Taken

#### 1. Process Termination
- Killed the malicious `chronyd2` process using `pkill -9 chronyd2`
- Verified the process was no longer running

#### 2. Attacker IP Blocking
- Blocked the attacker's IP address (146.70.199.168) using firewall rules
- Applied iptables rules to prevent future connections from this IP
- Commands used:
  ```bash
  iptables -A INPUT -s 146.70.199.168 -j DROP
  iptables -A OUTPUT -d 146.70.199.168 -j DROP
  ```

#### 3. Malicious File Removal
Removed all cryptocurrency miner files and directories:
- Deleted `/dev/shm/.kernel/` directory
- Deleted `/dev/shm/.dbus-bb/` directory
- Deleted `/root/.local/share/..dbus-bb/` directory
- Deleted `/root/.cache/..dbus-bb/` directory
- Deleted `/root/.local/share/..kernel/` directory
- Deleted `/root/.cache/..kernel/` directory

#### 4. Cron Job Cleanup
- Edited root's crontab to remove malicious entries
- Deleted the following lines:
  ```
  */3 * * * * /dev/shm/.kernel/cron.daily
  */3 * * * * /dev/shm/.dbus-bb/cache-clean.sh
  ```
- Preserved all legitimate cron jobs for the jajr-project

#### 5. Persistence Check
- Verified no malicious systemd services were installed
- Checked for other persistence mechanisms (none found)
- Scanned web directories for additional malware (none found)

### Security Improvements Needed

#### Critical Actions Required
1. **Change Root SSH Password** - Must be changed immediately to prevent re-infection
2. **Enable SSH Key Authentication** - Disable password-based SSH login
3. **Install Fail2Ban** - Automatically block brute-force attacks
4. **Regular Security Updates** - Keep system and software updated

#### Recommended Security Measures
1. **Strong Password Policy**
   - Use passwords with minimum 16 characters
   - Include uppercase, lowercase, numbers, and special characters
   - Use a password manager to generate and store passwords

2. **SSH Key Authentication**
   - Generate SSH key pairs for all users
   - Disable password authentication in SSH config
   - This makes brute-force attacks impossible

3. **Intrusion Prevention**
   - Install fail2ban to block repeated failed login attempts
   - Set up intrusion detection system (IDS)
   - Monitor SSH logs for suspicious activity

4. **Regular Security Audits**
   - Review access logs weekly
   - Scan for malware monthly
   - Update all software regularly
   - Review user accounts and remove unused ones

5. **Network Security**
   - Use a firewall to restrict unnecessary connections
   - Keep only essential ports open
   - Implement VPN for remote access

### Verification Steps
After cleanup, the following verifications were performed:
- ✅ Malicious process terminated
- ✅ Attacker IP blocked
- ✅ Malicious files removed from all locations
- ✅ Malicious cron jobs removed
- ✅ No malware found in web directories
- ✅ No malicious systemd services found
- ✅ Legitimate projects (jajr-project, v2_attendance, attendance) unaffected

### Current Status
- **Malware:** Completely removed
- **Attacker Access:** Blocked
- **Server Performance:** Restored to normal
- **Production Projects:** Running normally
- **Remaining Action:** Root password must be changed

---

## Lessons Learned

### What Went Wrong
1. Weak SSH password allowed brute-force attack
2. No SSH key authentication configured
3. No rate limiting on SSH attempts
4. No intrusion detection system
5. No regular security audits

### Preventive Measures for Future
1. Implement SSH key authentication immediately
2. Install fail2ban for brute-force protection
3. Regular security audits and monitoring
4. Keep all software updated
5. Use strong, unique passwords for all accounts
6. Monitor system resources for unusual activity

### Cost of Incident
- **Server Performance Degradation:** 2 days
- **Investigation Time:** 2 hours
- **Potential Financial Loss:** Server resources used for attacker's gain
- **Data Security Risk:** Attacker had root access for 12+ hours

---

## Recommendations for Management

### Immediate Actions Required
1. **Change Root Password** - This is critical and must be done immediately
2. **Implement SSH Key Authentication** - Prevent future password-based attacks
3. **Install Security Tools** - fail2ban, intrusion detection, monitoring

### Budget Considerations
- No additional software costs (all security tools are free/open-source)
- Time investment for security setup: 2-4 hours
- Ongoing maintenance: 1 hour per month for security audits

### Risk Assessment
- **Before Incident:** High risk due to weak authentication
- **After Incident:** Low risk once security improvements are implemented
- **Reoccurrence Probability:** Very low with proper security measures

### Business Impact
- **Short-term:** Server performance restored, projects running normally
- **Long-term:** Improved security posture prevents future incidents
- **Reputation:** No data breach reported, minimal business impact

---

## Conclusion

This security incident was caused by a brute-force SSH attack that installed cryptocurrency mining malware on the server. The incident has been fully resolved, and the attacker has been blocked. However, critical security improvements must be implemented to prevent future attacks.

The most important immediate action is to change the root SSH password, as the attacker still knows the old password and could potentially regain access.

With the recommended security improvements implemented, the server will be significantly more secure and the risk of similar incidents will be minimal.

---

**Report Prepared By:** System Administrator  
**Date:** April 23, 2026  
**Next Review Date:** May 23, 2026
