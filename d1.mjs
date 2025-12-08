import * as lib from './index.mjs';
const jsonOptions = { code: true, extraCodeBlock: 1 };
const json = obj => lib.bot.lines([
    '```json', lib.utilitas.prettyJson(obj, jsonOptions).replaceAll('```', ''), '```'
]);

const a = {
    callback: [
        {
            id: '69b69584-599d-c3a4-0bc2-701a19ce6124',
            label: '⚛️ OpenRouter (openai/gpt-5.1-codex): 📊🧠🧰👁️',
            text: '/set --ai=openrouter_openai_gpt_5_1_codex'
        },
        {
            id: '7701823f-22fb-3009-b9da-af121605750a',
            label: '⚛️ OpenRouter (openai/gpt-5-image): 🎨📊🧠🧰👁️',
            text: '/set --ai=openrouter_openai_gpt_5_image'
        },
        {
            id: 'e218aa75-86b4-ff6d-584a-37a5dcb6da9e',
            label: '✳️ OpenRouter (anthropic/claude-opus-4.5): 📊🧠🧰👁️',
            text: '/set --ai=openrouter_anthropic_claude_opus_4_5'
        },
        {
            id: '26ad777d-a986-f4dd-980b-e208805f68e6',
            label: '🐬 SiliconFlow (Pro/deepseek-ai/DeepSeek-R1): 🧠',
            text: '/set --ai=siliconflow_pro_deepseek_ai_deepseek_r1'
        },
        {
            id: '17ce3985-d390-e2ab-8432-048cdc1cd135',
            label: '✴️ Jina (jina-deepsearch-v1): 🔍📊🧠👁️',
            text: '/set --ai=jina_jina_deepsearch_v1'
        },
        {
            id: 'e11cc766-78d5-eb03-181d-8bb94ba2e1a3',
            label: '☑️ ♊️ OpenRouter (google/gemini-2.5-flash-preview-09-2025): ⚡️🧠🧰👁️',
            text: '/set --ai=openrouter_google_gemini_2_5_flash_preview_09_2025'
        },
        {
            id: '193eb1b2-6b66-4b1b-3d02-bd8c4b973245',
            label: '⚛️ OpenRouter (openai/gpt-5.1): ⚡️📊🧠🧰👁️',
            text: '/set --ai=openrouter_openai_gpt_5_1'
        },
        {
            id: 'ebed76a7-2b34-f822-d603-2b27b6badd39',
            label: '♊️ OpenRouter (google/gemini-3-pro-preview): 📊🧠🧰👁️',
            text: '/set --ai=openrouter_google_gemini_3_pro_preview'
        },
        {
            id: '1bb8232f-a000-1789-2d9a-59afd3e87d0f',
            label: '🍌 OpenRouter (google/Nano Banana Pro): ⚡️🎨📊👁️',
            text: '/set --ai=openrouter_google_gemini_3_pro_image_preview'
        },
        {
            id: '69b69584-599d-c3a4-0bc2-701a19ce6124',
            label: '⚛️ OpenRouter (openai/gpt-5.1-codex): 📊🧠🧰👁️',
            text: '/set --ai=openrouter_openai_gpt_5_1_codex'
        },
        {
            id: '7701823f-22fb-3009-b9da-af121605750a',
            label: '⚛️ OpenRouter (openai/gpt-5-image): 🎨📊🧠🧰👁️',
            text: '/set --ai=openrouter_openai_gpt_5_image'
        },
        {
            id: 'e218aa75-86b4-ff6d-584a-37a5dcb6da9e',
            label: '✳️ OpenRouter (anthropic/claude-opus-4.5): 📊🧠🧰👁️',
            text: '/set --ai=openrouter_anthropic_claude_opus_4_5'
        },
        {
            id: '17ce3985-d390-e2ab-8432-048cdc1cd135',
            label: '✴️ Jina (jina-deepsearch-v1): 🔍📊🧠👁️',
            text: '/set --ai=jina_jina_deepsearch_v1'
        },
        {
            id: '0a76255c-4630-9c62-1925-f8e7994540ff',
            label: "☑️ Test message; assistant confirms it's operational and ready to help",
            text: '/switch ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b'
        },
        {
            id: '0a76255c-4630-9c62-1925-f8e7994540ff',
            label: '☑️ Iterative comic-style illustration tweaks with sci‑fi outlining and Python/Markdown tooling Q&A',
            text: '/switch ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b'
        },
        {
            id: '0a76255c-4630-9c62-1925-f8e7994540ff',
            label: '☑️ Iterative comic-style illustration tweaks with sci‑fi outlining and Python/Markdown tooling Q&A',
            text: '/switch ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b'
        },
        {
            id: '0a76255c-4630-9c62-1925-f8e7994540ff',
            label: '☑️ Iterative comic-style illustration tweaks with sci‑fi outlining and Python/Markdown tooling Q&A',
            text: '/switch ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b'
        },
        {
            id: '0a76255c-4630-9c62-1925-f8e7994540ff',
            label: '☑️ Iterative comic-style illustration tweaks with sci‑fi outlining and Python/Markdown tooling Q&A',
            text: '/switch ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b'
        },
        {
            id: '0a76255c-4630-9c62-1925-f8e7994540ff',
            label: '☑️ Iterative comic-style illustration tweaks with sci‑fi outlining and Python/Markdown tooling Q&A',
            text: '/switch ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b'
        },
        {
            id: 'e11cc766-78d5-eb03-181d-8bb94ba2e1a3',
            label: '☑️ ♊️ OpenRouter (google/gemini-2.5-flash-preview-09-2025): ⚡️🧠🧰👁️',
            text: '/set --ai=openrouter_google_gemini_2_5_flash_preview_09_2025'
        },
        {
            id: '193eb1b2-6b66-4b1b-3d02-bd8c4b973245',
            label: '⚛️ OpenRouter (openai/gpt-5.1): ⚡️📊🧠🧰👁️',
            text: '/set --ai=openrouter_openai_gpt_5_1'
        },
        {
            id: 'ebed76a7-2b34-f822-d603-2b27b6badd39',
            label: '♊️ OpenRouter (google/gemini-3-pro-preview): 📊🧠🧰👁️',
            text: '/set --ai=openrouter_google_gemini_3_pro_preview'
        },
        {
            id: '1bb8232f-a000-1789-2d9a-59afd3e87d0f',
            label: '🍌 OpenRouter (google/Nano Banana Pro): ⚡️🎨📊👁️',
            text: '/set --ai=openrouter_google_gemini_3_pro_image_preview'
        },
        {
            id: '69b69584-599d-c3a4-0bc2-701a19ce6124',
            label: '⚛️ OpenRouter (openai/gpt-5.1-codex): 📊🧠🧰👁️',
            text: '/set --ai=openrouter_openai_gpt_5_1_codex'
        },
        {
            id: '7701823f-22fb-3009-b9da-af121605750a',
            label: '⚛️ OpenRouter (openai/gpt-5-image): 🎨📊🧠🧰👁️',
            text: '/set --ai=openrouter_openai_gpt_5_image'
        },
        {
            id: 'e218aa75-86b4-ff6d-584a-37a5dcb6da9e',
            label: '✳️ OpenRouter (anthropic/claude-opus-4.5): 📊🧠🧰👁️',
            text: '/set --ai=openrouter_anthropic_claude_opus_4_5'
        },
        {
            id: 'ba787502-ba46-24d1-cd82-7f5e456954ac',
            label: '🐬 SiliconFlow (deepseek-ai/DeepSeek-V3.2-exp): 📊🧠🧰',
            text: '/set --ai=siliconflow_deepseek_ai_deepseek_v3_2_exp'
        },
        {
            id: '17ce3985-d390-e2ab-8432-048cdc1cd135',
            label: '✴️ Jina (jina-deepsearch-v1): 🔍📊🧠👁️',
            text: '/set --ai=jina_jina_deepsearch_v1'
        },
        {
            id: '0a76255c-4630-9c62-1925-f8e7994540ff',
            label: '☑️ Iterative comic-style illustration tweaks with sci‑fi outlining and Python/Markdown tooling Q&A',
            text: '/switch ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b'
        },
        {
            id: '0a76255c-4630-9c62-1925-f8e7994540ff',
            label: '☑️ 插畫風格微調、科幻故事構思與開發技術綜合對話',
            text: '/switch ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b'
        }
    ],
    config: {
        tts: true,
        ai: 'openrouter_google_gemini_2_5_flash_preview_09_2025'
    },
    sessionId: 'ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b',
    sessions: [
        {
            id: 'ALAN_SESSION_54272018|93d5a7a9-912d-4d3c-abde-fb6dbab5dd0f-75c23c1d64c0c8c9c980e42e2c0378fdbae3b063356550cdac275a451690b89802bca00f0b050abeb2fe252af8b',
            createdAt: 1745050449828,
            touchedAt: 1764956851348,
            context: {},
            label: '插畫風格微調、科幻故事構思與開發技術綜合對話',
            labelUpdatedAt: 1764924030009
        }
    ],
    context: {},
    prompts: {},
    cmds: {
        '32': { args: '是什麼意思。', touchedAt: 1731976367230 },
        clearall: { args: '', touchedAt: 1732711575245 },
        clear: { args: '', touchedAt: 1764924058664 },
        new: { args: '✨', touchedAt: 1742107161714 },
        sent: {
            args: 'Mail") # optional - leave this line out to just grab the inbox\n' +
                'username = USER\n' +
                'password = PASS\n' +
                '\n' +
                '這個配置中，如果需要備份gmai的全部郵件，應該把mailboxes改為 all mail 麼？那個imap郵箱包含全部的郵件',
            touchedAt: 1728970305945
        },
        polish: { args: '❇️', touchedAt: 1750448489810 },
        end: { args: '❎', touchedAt: 1745050449828 },
        translate: { args: '🇨🇳', touchedAt: 1740547162173 },
        gemini: { args: 'tgesting', touchedAt: 1735971158566 },
        uptime: { args: '', touchedAt: 1765172852791 },
        cc12m: { args: '-type f -delete 可以顯示進度嗎', touchedAt: 1735281403903 },
        dream: { args: '帮我画一个人，媽媽抱着一个刚出生的宝宝，背景是医院', touchedAt: 1759306728034 },
        toen: {
            args: '候選人在面試之後完成了測試中沒寫出來的題目，提交了給我，有一定責任心。',
            touchedAt: 1735684809646
        },
        claude: { args: 'testing', touchedAt: 1735972367005 },
        set: {
            args: '--ai=openrouter_google_gemini_2_5_flash_preview_09_2025',
            touchedAt: 1764143881104
        },
        lorem: { args: '212312', touchedAt: 1738556183133 },
        help: { args: '', touchedAt: 1765172868304 },
        list: { args: '', touchedAt: 1764924030008 },
        switch: {
            args: 'ALAN_SESSION_54272018|af021200-f572-4f90-b87d-a0883f5849c3-37ec271b5313caaea60b9044bad4b277384e0322918a07d97759804680909366ebae243ef774eaf6e5d1ab232b1',
            touchedAt: 1745050439206
        },
        usr: {
            args: "/lib/python3/dist-packages/requests/__init__.py:87: RequestsDependencyWarning: urllib3 (2.2.3) or chardet (5.2.0) doesn't match a supported version!",
            touchedAt: 1736481538458
        },
        volumes: {
            args: '->\n' +
                '╰ $ > lsblk -o NAME,UUID,SIZE,TYPE,MOUNTPOINT\n' +
                'NAME                                                                                                  UUID                                     SIZE TYPE MOUNTPOINT\n' +
                'loop0                                                                                                                                         1000G loop /Volumes/Timeshift\n' +
                'sda                                                                                                   gRM1Gz-gisO-0SI3-xiaT-JcIs-VPTX-ziXihG   3.6T disk\n' +
                '└─ceph--a23cbc50--e9ce--49bc--92ff--342836a5c407-osd--block--caa6821e--ecbc--4f8f--8eb6--6cb7791b072a                                          3.6T lvm\n' +
                'sdb                                                                                                   HsEovc-EW2c-9Bnt-q1hq-qg8V-OV17-Ouy54W   3.6T disk\n' +
                '└─ceph--ad4d3b06--81c6--4a9b--8dca--1e40166d0a8e-osd--block--cde2d062--f0c5--4d36--bc3f--5d253ab370b7                                          3.6T lvm\n' +
                'sdc                                                                                                   n0XMwQ-KzIa-cfAe-NeBW-X4oL-pJor-PP0fsj   3.6T disk\n' +
                '└─ceph--980d806b--9d10--4af1--8b92--e92e5344566d-osd--block--0bf016bf--ee51--4cb0--bb66--d86dcd132221                                          3.6T lvm\n' +
                'sdd                                                                                                   kk6Fx6-VfOl-BcZU-AIUY-0uuu-IKHu-g3iaJK   3.6T disk\n' +
                '└─ceph--f53f30ba--e1da--4fee--9984--3b8fb05d946c-osd--block--0d70c755--43aa--4820--b67b--c41d941443f8                                          3.6T lvm\n' +
                'sde                                                                                                   OXNDLL-h9s0-lllb-YxGi-xjP5-NCwn-1dUrzW   3.6T disk\n' +
                '└─ceph--c827cac3--ecc5--4704--90fc--bce39194c0d9-osd--block--d9aaff51--6c31--4504--8029--44598bce7cb3                                          3.6T lvm\n' +
                'nvme0n1                                                                                                                                      953.9G disk\n' +
                '├─nvme0n1p1                                                                                           819F-1A0D                                512M part /boot/efi\n' +
                '└─nvme0n1p2                                                                                           783b6e99-0e39-4fa5-a5b9-eadc8e30342f   953.4G part / 為什麼 loop0沒有uuid應該怎麼解決',
            touchedAt: 1737962061734
        },
        all: { args: 'testing', touchedAt: 1764923948683 },
        clearkb: { args: '', touchedAt: 1745050424663 },
        search: { args: '畫畫', touchedAt: 1745049881763 },
        sys: {
            args: 'type sysfs (rw,nosuid,nodev,noexec,relatime)\n' +
                'proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)\n' +
                'udev on /dev type devtmpfs (rw,nosuid,relatime,size=198088916k,nr_inodes=49522229,mode=755,inode64)\n' +
                'devpts on /dev/pts type devpts (rw,nosuid,noexec,relatime,gid=5,mode=620,ptmxmode=000)\n' +
                'tmpfs on /run type tmpfs (rw,nosuid,nodev,noexec,relatime,size=39620460k,mode=755,inode64)\n' +
                '/dev/sda2 on / type ext4 (rw,relatime,errors=remount-ro)\n' +
                'securityfs on /sys/kernel/security type securityfs (rw,nosuid,nodev,noexec,relatime)\n' +
                'tmpfs on /dev/shm type tmpfs (rw,nosuid,nodev,inode64)\n' +
                'tmpfs on /run/lock type tmpfs (rw,nosuid,nodev,noexec,relatime,size=5120k,inode64)\n' +
                'cgroup2 on /sys/fs/cgroup type cgroup2 (rw,nosuid,nodev,noexec,relatime)\n' +
                'pstore on /sys/fs/pstore type pstore (rw,nosuid,nodev,noexec,relatime)\n' +
                'efivarfs on /sys/firmware/efi/efivars type efivarfs (rw,nosuid,nodev,noexec,relatime)\n' +
                'bpf on /sys/fs/bpf type bpf (rw,nosuid,nodev,noexec,relatime,mode=700)\n' +
                'systemd-1 on /proc/sys/fs/binfmt_misc type autofs (rw,relatime,fd=29,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=31936)\n' +
                'hugetlbfs on /dev/hugepages type hugetlbfs (rw,relatime,pagesize=2M)\n' +
                'mqueue on /dev/mqueue type mqueue (rw,nosuid,nodev,noexec,relatime)\n' +
                'debugfs on /sys/kernel/debug type debugfs (rw,nosuid,nodev,noexec,relatime)\n' +
                'tracefs on /sys/kernel/tracing type tracefs (rw,nosuid,nodev,noexec,relatime)\n' +
                'fusectl on /sys/fs/fuse/connections type fusectl (rw,nosuid,nodev,noexec,relatime)\n' +
                'configfs on /sys/kernel/config type configfs (rw,nosuid,nodev,noexec,relatime)\n' +
                'ramfs on /run/credentials/systemd-tmpfiles-setup-dev.service type ramfs (ro,nosuid,nodev,noexec,relatime,mode=700)\n' +
                'nfsd on /proc/fs/nfsd type nfsd (rw,relatime)\n' +
                'ramfs on /run/credentials/systemd-sysctl.service type ramfs (ro,nosuid,nodev,noexec,relatime,mode=700)\n' +
                '/var/lib/snapd/snaps/bare_5.snap on /snap/bare/5 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/batcat_10.snap on /snap/batcat/10 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/batcat_13.snap on /snap/batcat/13 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/cheat_4279.snap on /snap/cheat/4279 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/cheat_4243.snap on /snap/cheat/4243 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/core_17200.snap on /snap/core/17200 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/core_17210.snap on /snap/core/17210 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/core18_2846.snap on /snap/core18/2846 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/core18_2855.snap on /snap/core18/2855 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/core20_2434.snap on /snap/core20/2434 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/gping_13.snap on /snap/gping/13 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/procs_820.snap on /snap/procs/820 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/var/lib/snapd/snaps/procs_969.snap on /snap/procs/969 type squashfs (ro,nodev,relatime,errors=continue,threads=single,x-gdu.hide,x-gvfs-hide)\n' +
                '/dev/sda1 on /boot/efi type vfat (rw,relatime,fmask=0077,dmask=0077,codepage=437,iocharset=iso8859-1,shortname=mixed,errors=remount-ro)\n' +
                'ramfs on /run/credentials/systemd-tmpfiles-setup.service type ramfs (ro,nosuid,nodev,noexec,relatime,mode=700)\n' +
                'sunrpc on /run/rpc_pipefs type rpc_pipefs (rw,relatime)\n' +
                'binfmt_misc on /proc/sys/fs/binfmt_misc type binfmt_misc (rw,nosuid,nodev,noexec,relatime)',
            touchedAt: 1739888970512
        },
        ai: { args: '🤖', touchedAt: 1764922296937 },
        imagen: {
            args: '這張圖片幫我藝術化加工，但是需要保持是照片的風格，但是構圖和光影需要更戲劇性，有大師攝影的感覺。需要有氣氛，但是，主要不要P太過分，需要保留是照片的感覺，切記是寫實細節，照片應該是拍攝出來的，而不是遍佈各種後處理的痕跡，千萬不能有看不來後期處理的痕跡，以及繪畫的風格，另外。彩燈給我點亮。',
            touchedAt: 1762705446404
        },
        ai_openai_o3: { args: '', touchedAt: 1745048575534 },
        fantasy: { args: 'a cat riding a bike', touchedAt: 1764956851347 },
        gptimage: { args: '', touchedAt: 1746285207433 },
        ai_gemini_gemini_2_5_pro: { args: '/ai_openai_gpt_5 熊貓是什麼顏色的？', touchedAt: 1763433104727 },
        prompts: { args: '', touchedAt: 1764922415055 },
        thethreelaws: { args: '', touchedAt: 1765172918040 },
        echo: { args: '', touchedAt: 1765173203615 }
    }
}

console.log(json(a));
