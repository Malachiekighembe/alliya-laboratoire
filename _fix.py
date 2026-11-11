import pathlib, re

p = pathlib.Path(r"labo-web/app/(app)/profil/page.tsx")
text = p.read_text(encoding="utf-8")

# insert missing state after verifyingOtp
if "const [publicToken" not in text:
    text = text.replace(
        '  const [verifyingOtp, setVerifyingOtp] = React.useState(false);\r\n',
        '  const [verifyingOtp, setVerifyingOtp] = React.useState(false);\r\n  const [devCode, setDevCode] = React.useState<string | null>(null);\r\n  const [origin, setOrigin] = React.useState("");\r\n  const [publicToken, setPublicToken] = React.useState<string>("");\r\n\r\n  React.useEffect(() => { if (typeof window !== "undefined") setOrigin(window.location.origin); }, []);\r\n'
    )
    if "const [publicToken" not in text:
        text = text.replace(
            '  const [verifyingOtp, setVerifyingOtp] = React.useState(false);\n',
            '  const [verifyingOtp, setVerifyingOtp] = React.useState(false);\n  const [devCode, setDevCode] = React.useState<string | null>(null);\n  const [origin, setOrigin] = React.useState("");\n  const [publicToken, setPublicToken] = React.useState<string>("");\n\n  React.useEffect(() => { if (typeof window !== "undefined") setOrigin(window.location.origin); }, []);\n'
        )

# ensure devCode exists if added differently
if "const [devCode" not in text.split("const [publicToken")[0] if "const [publicToken" in text else text:
    pass

p.write_text(text, encoding="utf-8")
print("fixed states")
